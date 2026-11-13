import { saveTravelSettings } from "@daniel/db";
import { TestDatabaseLive } from "@daniel/db/testing";
import { studioToday } from "@daniel/shared/studio";
import { layer } from "@effect/vitest";
import { addDays, format, parseISO } from "date-fns";
import { ConfigProvider, Effect, Layer } from "effect";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";
import { expect } from "vite-plus/test";

import { TravelData, TravelDataLive } from "../../src/server/travel/travel-data.server";
import { estimateTrip } from "../../src/server/travel/travel.server";

const SERPAPI_KEY = "test-serpapi-key";
const FARES_TOKEN = "test-travelpayouts-token";

const bothKeys = { serpApiKey: SERPAPI_KEY, faresToken: FARES_TOKEN };

const settings = {
  coachFareEuros: 10,
  coachMinutes: 50,
  carDayMinEuros: 20,
  carDayMaxEuros: 35,
  rideMinEuros: 35,
  rideMaxEuros: 55,
  driveMinutes: 40,
  hotelFromEuros: 45,
  hotelTypicalMinEuros: 60,
  hotelTypicalMaxEuros: 110,
};

const trip = { from: "London, United Kingdom", arrive: "2026-12-03", leave: "2026-12-06" };

// The first city is not the one the visitor picked; London's airports follow its city entry.
const places = [
  { type: "city", code: "YXU", name: "London", country_code: "CA", country_name: "Canada" },
  { type: "city", code: "LON", name: "London", country_code: "GB", country_name: "United Kingdom" },
  ...["LGW", "LHR", "STN"].map((code) => ({
    type: "airport",
    code,
    name: `London ${code}`,
    country_code: "GB",
    country_name: "United Kingdom",
    city_code: "LON",
  })),
];

const airlines = [
  { code: "FR", name: "Ryanair" },
  // easyJet flies under several codes; the visitor sees one easyJet.
  { code: "U2", name: "easyJet" },
  { code: "EC", name: "easyJet" },
  { code: "TP", name: "TAP Air Portugal" },
  { code: "VY", name: "Vueling" },
  { code: "W9", name: null, name_translations: { en: "Wizz Air UK" } },
];

const fare = (airline: string, price: unknown) => ({
  airline,
  price,
  flight_number: "1234",
  departure_at: "2026-12-03T07:35:00+00:00",
  origin_airport: "STN",
  destination_airport: "OPO",
  transfers: 0,
});

/**
 * Fares that Aviasales users found. Ryanair: 2 return fares average €70, and 3 fares each way
 * average €40 out plus €40 back, so the one-way sum (€80) stands for more trips and wins. easyJet:
 * €100 and €120 under two codes, €110. TAP has one fare, Vueling's price is malformed, and Wizz
 * Air only flies out: none of them has an average.
 */
const fares = {
  roundTrips: [
    fare("FR", 60),
    fare("FR", 80),
    fare("U2", 100),
    fare("EC", 120),
    fare("TP", 150),
    fare("VY", "unavailable"),
  ],
  outbound: [fare("FR", 30), fare("FR", 40), fare("FR", 50), fare("W9", 45), fare("W9", 55)],
  inbound: [fare("FR", 35), fare("FR", 40), fare("FR", 45)],
};

/** One fare for one airline: not an average, for any airline or for all of them together. */
const tooFewFares = [fare("TP", 150)];

/** One return fare each for three airlines: no airline has an average, all of them together do. */
const spreadFares = [fare("TP", 600), fare("VY", 700), fare("FR", 800)];

const itinerary = (names: ReadonlyArray<string>, price: unknown, minutes: number) => ({
  price,
  type: "Round trip",
  flights: names.map((airline) => ({
    airline,
    departure_airport: { id: "LGW", time: "2026-12-03 07:35" },
    arrival_airport: { id: "OPO", time: "2026-12-03 10:10" },
  })),
  layovers: names.slice(1).map(() => ({ duration: 90, id: "LIS" })),
  total_duration: minutes,
});

/** Google Flights round trips, through SerpApi: the live prices for a route with too few fares. */
const googleFlights = {
  best_flights: [itinerary(["TAP Air Portugal"], 182, 150), itinerary(["Ryanair"], 95.4, 155)],
  other_flights: [
    itinerary(["Ryanair"], 120, 150),
    itinerary(["easyJet", "easyJet"], 140, 300),
    itinerary(["Vueling"], "unavailable", 200),
    itinerary(["British Airways"], 210, 145),
  ],
};

/** The cheapest live fare of each of the three cheapest airlines. */
const liveFlights = [
  { source: "live", airline: "Ryanair", priceEuros: 95, stops: 0, durationMinutes: 155 },
  { source: "live", airline: "easyJet", priceEuros: 140, stops: 1, durationMinutes: 300 },
  { source: "live", airline: "TAP Air Portugal", priceEuros: 182, stops: 0, durationMinutes: 150 },
];

// Google Hotels, cheapest first: the estimate keeps the three cheapest and averages them.
const hotels = {
  properties: [
    {
      type: "hotel",
      name: "Hotel Braga",
      rate_per_night: { extracted_lowest: 38 },
      overall_rating: 3.5,
      extracted_hotel_class: 3,
    },
    {
      type: "hotel",
      name: "Hotel Avenida",
      rate_per_night: { extracted_lowest: 40.4 },
      overall_rating: 4,
    },
    { type: "hotel", name: "Price on request", rate_per_night: { lowest: "Ask" } },
    {
      type: "hotel",
      name: "Bossa Nova",
      rate_per_night: { extracted_lowest: 44 },
      extracted_hotel_class: 3,
    },
    {
      type: "hotel",
      name: "Grand Hotel",
      rate_per_night: { extracted_lowest: 120 },
      extracted_hotel_class: 5,
    },
  ],
};

/** What SerpApi answers when the plan's searches for the month are used up. */
const outOfSearches: Answer = {
  status: 429,
  body: { error: "Your account has run out of searches." },
};

const isFareLookup = (url: URL) =>
  url.hostname === "api.travelpayouts.com" && url.pathname === "/aviasales/v3/prices_for_dates";

const isAirlineList = (url: URL) =>
  url.hostname === "api.travelpayouts.com" && url.pathname === "/data/en/airlines.json";

const engineOf = (url: URL) =>
  url.hostname === "serpapi.com" ? url.searchParams.get("engine") : null;

const isFlightSearch = (url: URL) => engineOf(url) === "google_flights";

const isHotelSearch = (url: URL) => engineOf(url) === "google_hotels";

/** The fares for one lookup: return trips, or one way out of or back to the visitor's city. */
const faresFor = (url: URL) => {
  if (url.searchParams.get("one_way") === "false") return fares.roundTrips;

  return url.searchParams.get("origin") === "OPO" ? fares.inbound : fares.outbound;
};

const fareData = (data: unknown): Answer => ({
  status: 200,
  body: { success: true, currency: "eur", data },
});

/** Every source as it answers when it works. */
const working = (url: URL): Answer => {
  if (isFareLookup(url)) return fareData(faresFor(url));

  if (isAirlineList(url)) return { status: 200, body: airlines };

  if (isFlightSearch(url)) return { status: 200, body: googleFlights };

  if (isHotelSearch(url)) return { status: 200, body: hotels };

  return { status: 200, body: places };
};

/** Every source works, except that fare lookups and live flight searches answer as given. */
const routeWith =
  (fareAnswer: Answer, flightAnswer: Answer) =>
  (url: URL): Answer => {
    if (isFareLookup(url)) return fareAnswer;

    return isFlightSearch(url) ? flightAnswer : working(url);
  };

/**
 * The travel data service against fake sources, which record every request. Only the HTTP
 * boundary is fake: caching, decoding, averaging, and configuration are the production code.
 */
const travelDataWith = (answer: (url: URL) => Answer, keys: Keys) => {
  const requests: Array<SeenRequest> = [];

  const client = HttpClient.make((request, url, _signal, fiber) => {
    requests.push({
      url,
      token: request.headers["x-access-token"],
      traced: !fiber.getRef(HttpClient.TracerDisabledWhen)(request),
    });

    const { status, body } = answer(url);

    return Effect.succeed(
      HttpClientResponse.fromWeb(
        request,
        new Response(JSON.stringify(body), {
          status,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
  });

  const config = {
    ...(keys.serpApiKey === null ? {} : { SERPAPI_API_KEY: keys.serpApiKey }),
    ...(keys.faresToken === null ? {} : { TRAVELPAYOUTS_TOKEN: keys.faresToken }),
  };

  const live = TravelDataLive.pipe(
    Layer.provide(Layer.succeed(HttpClient.HttpClient, client)),
    Layer.provide(ConfigProvider.layer(ConfigProvider.fromUnknown(config))),
  );

  const fareLookups = () => requests.filter(({ url }) => isFareLookup(url));
  const flightSearches = () => requests.filter(({ url }) => isFlightSearch(url));
  const hotelSearches = () => requests.filter(({ url }) => isHotelSearch(url));

  return { live, fareLookups, flightSearches, hotelSearches };
};

/** The estimate program on a private PostgreSQL cluster, with the travel figures saved. */
layer(TestDatabaseLive, { excludeTestServices: true, timeout: "120 seconds" })(
  "trip estimate",
  (it) => {
    it.effect("adds the cheapest average fare, the bus, and the average hotel night", () =>
      Effect.gen(function* () {
        yield* saveTravelSettings(settings);

        const travelData = travelDataWith(working, bothKeys);

        const estimate = yield* estimateTrip(trip).pipe(Effect.provide(travelData.live));

        expect(estimate.city?.code).toBe("LON");
        expect(estimate.flightStatus).toBe("averages");
        expect(estimate.flights).toEqual([
          {
            source: "average",
            airline: "Ryanair",
            priceEuros: 80,
            stops: null,
            durationMinutes: null,
          },
          {
            source: "average",
            airline: "easyJet",
            priceEuros: 110,
            stops: null,
            durationMinutes: null,
          },
        ]);
        // The three cheapest hotels with a price; their average is (38 + 40 + 44) / 3 = 40.67.
        expect(estimate.hotelStatus).toBe("found");
        expect(
          estimate.hotels.map(({ name, pricePerNightEuros }) => [name, pricePerNightEuros]),
        ).toEqual([
          ["Hotel Braga", 38],
          ["Hotel Avenida", 40],
          ["Bossa Nova", 44],
        ]);
        expect(estimate.hotelAverage).toBe(41);
        expect(estimate.total).toEqual({
          minEuros: 80 + 2 * 10 + 3 * 41,
          maxEuros: 110 + 2 * 10 + 3 * 41,
        });

        // Each live flight search costs money; a route with averages needs none.
        expect(travelData.flightSearches()).toHaveLength(0);

        // Return fares, then one way each direction, all for the city, so every airport counts.
        expect(
          travelData
            .fareLookups()
            .map(({ url }) =>
              ["origin", "destination", "one_way", "currency"]
                .map((name) => url.searchParams.get(name))
                .join(" "),
            )
            .toSorted((first, second) => first.localeCompare(second)),
        ).toEqual(["LON OPO false eur", "LON OPO true eur", "OPO LON true eur"]);

        // The token goes in a header, never the address, and no trace records either.
        for (const lookup of travelData.fareLookups()) {
          expect(lookup.token).toBe(FARES_TOKEN);
          expect(lookup.url.toString()).not.toContain(FARES_TOKEN);
          expect(lookup.traced).toBe(false);
        }

        const [hotelSearch] = travelData.hotelSearches();

        // Cheapest first, but only rooms a client would book: 3 stars or more, rated 3.5 or more.
        expect(Object.fromEntries(hotelSearch?.url.searchParams ?? [])).toMatchObject({
          q: "Hotels in Braga, Portugal",
          check_in_date: trip.arrive,
          check_out_date: trip.leave,
          sort_by: "3",
          hotel_class: "3,4,5",
          rating: "7",
          adults: "1",
          currency: "EUR",
          api_key: SERPAPI_KEY,
        });

        // SerpApi takes the key only in the address, and traces record addresses.
        expect(hotelSearch?.traced).toBe(false);
      }),
    );

    it.effect.each([
      {
        name: "when the route has too few recent fares",
        answer: routeWith(fareData(tooFewFares), { status: 200, body: googleFlights }),
        keys: bothKeys,
      },
      {
        name: "when the fare data is down",
        answer: routeWith({ status: 503, body: {} }, { status: 200, body: googleFlights }),
        keys: bothKeys,
      },
      {
        name: "without a Travelpayouts token",
        answer: working,
        keys: { ...bothKeys, faresToken: null },
      },
    ])("uses live Google Flights prices $name", ({ answer, keys }) =>
      Effect.gen(function* () {
        yield* saveTravelSettings(settings);

        const travelData = travelDataWith(answer, keys);

        const estimate = yield* estimateTrip(trip).pipe(Effect.provide(travelData.live));

        expect(estimate.flightStatus).toBe("live");
        expect(estimate.flights).toEqual(liveFlights);
        expect(estimate.total).toEqual({
          minEuros: 95 + 2 * 10 + 3 * 41,
          maxEuros: 182 + 2 * 10 + 3 * 41,
        });

        const [search] = travelData.flightSearches();

        // One search, for the visitor's dates, from every airport of the city.
        expect(travelData.flightSearches()).toHaveLength(1);
        expect(Object.fromEntries(search?.url.searchParams ?? [])).toMatchObject({
          engine: "google_flights",
          type: "1",
          departure_id: "LGW,LHR,STN",
          arrival_id: "OPO",
          outbound_date: trip.arrive,
          return_date: trip.leave,
          currency: "EUR",
          api_key: SERPAPI_KEY,
        });
        expect(search?.traced).toBe(false);
      }),
    );

    it.effect("averages all airlines together when live prices are not available", () =>
      Effect.gen(function* () {
        yield* saveTravelSettings(settings);

        const travelData = travelDataWith(
          routeWith(fareData(spreadFares), outOfSearches),
          bothKeys,
        );

        const estimate = yield* estimateTrip(trip).pipe(Effect.provide(travelData.live));

        expect(estimate.flightStatus).toBe("averages");
        expect(estimate.flights).toEqual([
          { source: "average", airline: null, priceEuros: 700, stops: null, durationMinutes: null },
        ]);
        expect(estimate.total).toEqual({
          minEuros: 700 + 2 * 10 + 3 * 41,
          maxEuros: 700 + 2 * 10 + 3 * 41,
        });
        expect(travelData.flightSearches()).toHaveLength(1);
      }),
    );

    it.effect("prices hotels for an example trip four weeks ahead when there are no dates", () =>
      Effect.gen(function* () {
        const travelData = travelDataWith(working, bothKeys);

        const estimate = yield* estimateTrip({ from: trip.from }).pipe(
          Effect.provide(travelData.live),
        );

        const outbound = addDays(parseISO(studioToday()), 28);
        const [hotelSearch] = travelData.hotelSearches();

        expect(estimate.tripDates).toEqual({
          outbound: format(outbound, "yyyy-MM-dd"),
          return: format(addDays(outbound, 2), "yyyy-MM-dd"),
          example: true,
        });
        expect(estimate.nights).toBe(2);
        expect(estimate.flightStatus).toBe("averages");
        expect(hotelSearch?.url.searchParams.get("check_in_date")).toBe(
          estimate.tripDates.outbound,
        );
      }),
    );

    it.effect("uses the typical hotel prices when live hotel prices are not available", () =>
      Effect.gen(function* () {
        yield* saveTravelSettings(settings);

        const travelData = travelDataWith(
          (url) => (isHotelSearch(url) ? { status: 503, body: {} } : working(url)),
          bothKeys,
        );

        const estimate = yield* estimateTrip(trip).pipe(Effect.provide(travelData.live));

        expect(estimate.hotelStatus).toBe("unavailable");
        expect(estimate.hotelAverage).toBeNull();
        expect(estimate.total).toEqual({
          minEuros: 80 + 2 * 10 + 3 * 60,
          maxEuros: 110 + 2 * 10 + 3 * 110,
        });
      }),
    );

    // The status decides what the visitor reads: "not enough fares" must mean exactly that.
    it.effect.each([
      {
        // One fare out and one fare back are one trip, like one return fare: not an average.
        name: "when the route has too few fares and live prices are used up",
        answer: routeWith(fareData(tooFewFares), outOfSearches),
        keys: bothKeys,
        status: "none",
        looksUp: true,
        city: "LON",
      },
      {
        name: "when Travelpayouts has nothing and Google Flights has no flights",
        answer: routeWith(
          { status: 200, body: { success: false, data: null, error: "No data" } },
          { status: 200, body: { error: "Google Flights hasn't returned any results." } },
        ),
        keys: bothKeys,
        status: "none",
        looksUp: true,
        city: "LON",
      },
      {
        name: "when Travelpayouts refuses the token and live prices are used up",
        answer: routeWith({ status: 401, body: { error: "Unauthorized" } }, outOfSearches),
        keys: bothKeys,
        status: "unavailable",
        looksUp: true,
        city: "LON",
      },
      {
        name: "without a Travelpayouts token or a SerpApi key",
        answer: working,
        keys: { serpApiKey: null, faresToken: null },
        status: "unavailable",
        looksUp: false,
        city: "LON",
      },
      {
        name: "when the city search is down",
        answer: (url: URL): Answer =>
          engineOf(url) !== null || url.hostname === "api.travelpayouts.com"
            ? working(url)
            : { status: 503, body: { error: "Service unavailable" } },
        keys: bothKeys,
        status: "unavailable",
        looksUp: false,
        city: undefined,
      },
      {
        name: "for a city nobody knows",
        answer: (url: URL): Answer =>
          engineOf(url) !== null || url.hostname === "api.travelpayouts.com"
            ? working(url)
            : { status: 200, body: [] },
        keys: bothKeys,
        status: "unknownCity",
        looksUp: false,
        city: undefined,
      },
    ])("shows no flight prices $name", ({ answer, keys, status, looksUp, city }) =>
      Effect.gen(function* () {
        yield* saveTravelSettings(settings);

        const travelData = travelDataWith(answer, keys);

        const estimate = yield* estimateTrip(trip).pipe(Effect.provide(travelData.live));

        expect(estimate.flightStatus).toBe(status);
        expect(estimate.unknownCity).toBe(status === "unknownCity");
        expect(estimate.city?.code).toBe(city);
        expect(estimate.flights).toEqual([]);
        expect(estimate.total).toBeNull();
        expect(estimate.settings).toEqual(settings);
        // Without a token or a city, nothing is sent. A failed lookup stops the other two.
        expect(travelData.fareLookups().length > 0).toBe(looksUp);
      }),
    );

    // Each SerpApi search costs money, and a past trip has nothing to book or to add up.
    it.effect.each([
      { name: "keeps the average fares", answer: working, status: "averages" },
      {
        name: "searches no live flights for a route with too few fares",
        answer: routeWith(fareData(tooFewFares), { status: 200, body: googleFlights }),
        status: "none",
      },
    ])("for past dates, $name, without a hotel search or a total", ({ answer, status }) =>
      Effect.gen(function* () {
        yield* saveTravelSettings(settings);

        const travelData = travelDataWith(answer, bothKeys);

        const estimate = yield* estimateTrip({
          from: trip.from,
          arrive: "2020-01-03",
          leave: "2020-01-06",
        }).pipe(Effect.provide(travelData.live));

        expect(estimate.flightStatus).toBe(status);
        expect(estimate.hotelStatus).toBe("past");
        expect(estimate.total).toBeNull();
        expect(travelData.flightSearches()).toHaveLength(0);
        expect(travelData.hotelSearches()).toHaveLength(0);
      }),
    );

    it.effect.each([
      {
        name: "the Travelpayouts token",
        secret: FARES_TOKEN,
        lookup: Effect.gen(function* () {
          const service = yield* TravelData;

          yield* service.findAverageFares({ origin: "LON", destination: "OPO" });
        }),
      },
      {
        name: "the SerpApi key",
        secret: SERPAPI_KEY,
        lookup: Effect.gen(function* () {
          const service = yield* TravelData;

          yield* service.findLiveFares({
            origins: ["LHR"],
            destination: "OPO",
            outboundDate: trip.arrive,
            returnDate: trip.leave,
          });
        }),
      },
    ])("keeps $name out of the error it reports", ({ secret, lookup }) =>
      Effect.gen(function* () {
        const travelData = travelDataWith(
          (url) =>
            isFareLookup(url) || engineOf(url) !== null
              ? { status: 401, body: { error: "Invalid API key." } }
              : working(url),
          bothKeys,
        );

        const error = yield* lookup.pipe(Effect.provide(travelData.live), Effect.flip);

        expect(error._tag).toBe("TravelDataError");
        expect(JSON.stringify(error)).not.toContain(secret);
        expect(String(error)).not.toContain(secret);
      }),
    );
  },
);

type Answer = {
  readonly status: number;
  readonly body: unknown;
};

type Keys = {
  readonly serpApiKey: string | null;
  readonly faresToken: string | null;
};

type SeenRequest = {
  readonly url: URL;
  /** The `X-Access-Token` header, where Travelpayouts takes its token. */
  readonly token: string | undefined;
  readonly traced: boolean;
};
