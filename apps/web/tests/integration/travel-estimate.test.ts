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

const API_KEY = "test-serpapi-key";

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

const itinerary = (airlines: ReadonlyArray<string>, price: unknown, minutes: number) => ({
  price,
  type: "Round trip",
  flights: airlines.map((airline) => ({
    airline,
    departure_airport: { id: "LGW", time: "2026-12-03 07:35" },
    arrival_airport: { id: "OPO", time: "2026-12-03 10:10" },
  })),
  layovers: airlines.slice(1).map(() => ({ duration: 90, id: "LIS" })),
  total_duration: minutes,
});

const flights = {
  best_flights: [itinerary(["TAP Air Portugal"], 182, 150), itinerary(["Ryanair"], 95.4, 155)],
  other_flights: [
    itinerary(["Ryanair"], 120, 150),
    itinerary(["easyJet", "easyJet"], 140, 300),
    itinerary(["Vueling"], "unavailable", 200),
    itinerary(["British Airways"], 210, 145),
  ],
};

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

const engineOf = (url: URL) =>
  url.hostname === "serpapi.com" ? url.searchParams.get("engine") : null;

const isFlightSearch = (url: URL) => engineOf(url) === "google_flights";

const isHotelSearch = (url: URL) => engineOf(url) === "google_hotels";

/** Every source as it answers when it works. */
const working = (url: URL): Answer => {
  if (isFlightSearch(url)) return { status: 200, body: flights };

  if (isHotelSearch(url)) return { status: 200, body: hotels };

  return { status: 200, body: places };
};

/**
 * The travel data service against fake sources, which record every request. Only the HTTP
 * boundary is fake: caching, decoding, and configuration are the production code.
 */
const travelDataWith = (answer: (url: URL) => Answer, apiKey: string | null) => {
  const requests: Array<SeenRequest> = [];

  const client = HttpClient.make((request, url, _signal, fiber) => {
    requests.push({ url, traced: !fiber.getRef(HttpClient.TracerDisabledWhen)(request) });

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

  const config = apiKey === null ? {} : { SERPAPI_API_KEY: apiKey };

  const live = TravelDataLive.pipe(
    Layer.provide(Layer.succeed(HttpClient.HttpClient, client)),
    Layer.provide(ConfigProvider.layer(ConfigProvider.fromUnknown(config))),
  );

  const flightSearches = () => requests.filter(({ url }) => isFlightSearch(url));
  const hotelSearches = () => requests.filter(({ url }) => isHotelSearch(url));

  return { live, flightSearches, hotelSearches };
};

/** The estimate program on a private PostgreSQL cluster, with the travel figures saved. */
layer(TestDatabaseLive, { excludeTestServices: true, timeout: "120 seconds" })(
  "trip estimate",
  (it) => {
    it.effect("adds the cheapest fare of each airline, the bus, and the average hotel night", () =>
      Effect.gen(function* () {
        yield* saveTravelSettings(settings);

        const travelData = travelDataWith(working, API_KEY);

        const estimate = yield* estimateTrip(trip).pipe(Effect.provide(travelData.live));

        expect(estimate.city?.code).toBe("LON");
        expect(estimate.flightStatus).toBe("found");
        expect(
          estimate.flights.map(({ airline, priceEuros, stops }) => [airline, priceEuros, stops]),
        ).toEqual([
          ["Ryanair", 95, 0],
          ["easyJet", 140, 1],
          ["TAP Air Portugal", 182, 0],
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
          minEuros: 95 + 2 * 10 + 3 * 41,
          maxEuros: 182 + 2 * 10 + 3 * 41,
        });

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
        });
        expect(hotelSearch?.traced).toBe(false);

        const [search] = travelData.flightSearches();

        // One search covers every airport of the city.
        expect(Object.fromEntries(search?.url.searchParams ?? [])).toMatchObject({
          engine: "google_flights",
          type: "1",
          departure_id: "LGW,LHR,STN",
          arrival_id: "OPO",
          outbound_date: trip.arrive,
          return_date: trip.leave,
          currency: "EUR",
          api_key: API_KEY,
        });

        // SerpApi takes the key only in the address, and traces record addresses.
        expect(search?.traced).toBe(false);
      }),
    );

    it.effect("prices an example trip four weeks ahead when the visitor gives no dates", () =>
      Effect.gen(function* () {
        const travelData = travelDataWith(working, API_KEY);

        const estimate = yield* estimateTrip({ from: trip.from }).pipe(
          Effect.provide(travelData.live),
        );

        const outbound = addDays(parseISO(studioToday()), 28);
        const [search] = travelData.flightSearches();

        expect(estimate.tripDates).toEqual({
          outbound: format(outbound, "yyyy-MM-dd"),
          return: format(addDays(outbound, 2), "yyyy-MM-dd"),
          example: true,
        });
        expect(estimate.nights).toBe(2);
        expect(search?.url.searchParams.get("outbound_date")).toBe(estimate.tripDates.outbound);
      }),
    );

    it.effect("uses the typical hotel prices when live hotel prices are not available", () =>
      Effect.gen(function* () {
        yield* saveTravelSettings(settings);

        const travelData = travelDataWith(
          (url) => (isHotelSearch(url) ? { status: 503, body: {} } : working(url)),
          API_KEY,
        );

        const estimate = yield* estimateTrip(trip).pipe(Effect.provide(travelData.live));

        expect(estimate.hotelStatus).toBe("unavailable");
        expect(estimate.hotelAverage).toBeNull();
        expect(estimate.total).toEqual({
          minEuros: 95 + 2 * 10 + 3 * 60,
          maxEuros: 182 + 2 * 10 + 3 * 110,
        });
      }),
    );

    // The status decides what the visitor reads: "No flights found" must mean exactly that.
    it.effect.each([
      {
        name: "without an API key",
        answer: working,
        apiKey: null,
        status: "unavailable",
        searches: 0,
        hotelSearches: 0,
        city: "LON",
      },
      {
        name: "when Google Flights has no flights",
        answer: (url: URL): Answer =>
          isFlightSearch(url)
            ? { status: 200, body: { error: "Google Flights hasn't returned any results." } }
            : { status: 200, body: places },
        apiKey: API_KEY,
        status: "none",
        searches: 1,
        hotelSearches: 1,
        city: "LON",
      },
      {
        name: "when SerpApi refuses the key or the plan is used up",
        answer: (url: URL): Answer =>
          isFlightSearch(url)
            ? { status: 401, body: { error: "Invalid API key." } }
            : { status: 200, body: places },
        apiKey: API_KEY,
        status: "unavailable",
        searches: 1,
        hotelSearches: 1,
        city: "LON",
      },
      {
        name: "when the city search is down",
        answer: (): Answer => ({ status: 503, body: { error: "Service unavailable" } }),
        apiKey: API_KEY,
        status: "unavailable",
        searches: 0,
        hotelSearches: 1,
        city: undefined,
      },
      {
        name: "for a city nobody knows",
        answer: (): Answer => ({ status: 200, body: [] }),
        apiKey: API_KEY,
        status: "unknownCity",
        searches: 0,
        hotelSearches: 1,
        city: undefined,
      },
      {
        // Each search costs money, and a past trip has nothing to book.
        name: "for dates in the past, without spending a search",
        answer: working,
        apiKey: API_KEY,
        status: "past",
        searches: 0,
        hotelSearches: 0,
        city: "LON",
        dates: { arrive: "2020-01-03", leave: "2020-01-06" },
      },
    ])(
      "answers with links only $name",
      ({ answer, apiKey, status, searches, hotelSearches, city, dates }) =>
        Effect.gen(function* () {
          yield* saveTravelSettings(settings);

          const travelData = travelDataWith(answer, apiKey);

          const estimate = yield* estimateTrip({ ...trip, ...dates }).pipe(
            Effect.provide(travelData.live),
          );

          expect(estimate.flightStatus).toBe(status);
          expect(estimate.unknownCity).toBe(status === "unknownCity");
          expect(estimate.city?.code).toBe(city);
          expect(estimate.flights).toEqual([]);
          expect(estimate.total).toBeNull();
          expect(estimate.settings).toEqual(settings);
          expect(travelData.flightSearches()).toHaveLength(searches);
          expect(travelData.hotelSearches()).toHaveLength(hotelSearches);
        }),
    );

    it.effect("keeps the API key out of the error it reports", () =>
      Effect.gen(function* () {
        const travelData = travelDataWith(
          (url) =>
            isFlightSearch(url)
              ? { status: 401, body: { error: "Invalid API key." } }
              : { status: 200, body: places },
          API_KEY,
        );

        const error = yield* Effect.gen(function* () {
          const service = yield* TravelData;

          return yield* service.findFares({
            origins: ["LHR"],
            destination: "OPO",
            outboundDate: trip.arrive,
            returnDate: trip.leave,
          });
        }).pipe(Effect.provide(travelData.live), Effect.flip);

        expect(error._tag).toBe("TravelDataError");
        expect(JSON.stringify(error)).not.toContain(API_KEY);
        expect(String(error)).not.toContain(API_KEY);
      }),
    );
  },
);

type Answer = {
  readonly status: number;
  readonly body: unknown;
};

type SeenRequest = {
  readonly url: URL;
  readonly traced: boolean;
};
