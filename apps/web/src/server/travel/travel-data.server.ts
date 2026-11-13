import "@tanstack/react-start/server-only";
import {
  Array as Arr,
  Cache,
  Config,
  Context,
  Data,
  type Duration,
  Effect,
  Exit,
  Layer,
  Option,
  Redacted,
  Schema,
} from "effect";
import { HttpClient, HttpClientRequest, HttpClientResponse } from "effect/unstable/http";

import { describeHttpFailure } from "../describe-http-failure";

const PLACES_URL = "https://autocomplete.travelpayouts.com/places2";
const FARES_URL = "https://api.travelpayouts.com/aviasales/v3/prices_for_dates";
const AIRLINES_URL = "https://api.travelpayouts.com/data/en/airlines.json";
const SERPAPI_URL = "https://serpapi.com/search.json";

/** City search runs while the visitor types, so a slow answer counts as no answer. */
const PLACES_TIMEOUT = "6 seconds";

/** Fares and airline names come from Travelpayouts' cache and answer in well under a second. */
const FARES_TIMEOUT = "10 seconds";

/** A Google search through SerpApi takes 2 to 6 seconds; the page shows links meanwhile. */
const SERPAPI_TIMEOUT = "15 seconds";

/** Each new hotel search costs one SerpApi search, so a repeated search reuses the answer. */
const HOTELS_TIME_TO_LIVE = "6 hours";

/**
 * Live flight searches run only for routes with too few recent fares, and each costs one SerpApi
 * search, so a repeated search reuses the answer for a whole day.
 */
const FLIGHTS_TIME_TO_LIVE = "1 day";

/** Travelpayouts keeps fares for 2 to 7 days, so an average from today stays good until tomorrow. */
const FARES_TIME_TO_LIVE = "1 day";
const PLACES_TIME_TO_LIVE = "1 day";
const AIRLINES_TIME_TO_LIVE = "7 days";

/** A failed lookup is retried soon, but not on every page view. */
const FAILURE_TIME_TO_LIVE = "1 minute";

/** Fares that Portuguese Aviasales users found. Other markets gave the same fares in tests. */
const FARES_MARKET = "pt";

/** An airline shows only with at least this many fares: one fare is not an average. */
const MIN_FARES = 2;

/**
 * Hotels with 3 stars or more and a review score of 3.5 or more (`rating=7`). Without these
 * filters the cheapest results in Braga are hostel beds, which a client would not book.
 */
const HOTEL_FILTERS = { hotel_class: "3,4,5", rating: "7" };

const timeToLive =
  (success: Duration.Input) =>
  (exit: Exit.Exit<unknown, unknown>): Duration.Input =>
    Exit.isSuccess(exit) ? success : FAILURE_TIME_TO_LIVE;

const Place = Schema.Struct({
  type: Schema.String,
  code: Schema.String,
  name: Schema.String,
  country_code: Schema.String,
  country_name: Schema.String,
  city_code: Schema.optional(Schema.NullOr(Schema.String)),
});

/** A fare that Aviasales users found recently: the airline's IATA code and the ticket price. */
const Fare = Schema.Struct({
  airline: Schema.String,
  price: Schema.Finite,
});

const Segment = Schema.Struct({
  airline: Schema.String,
});

/** A round trip as Google Flights lists it: the outbound flights and the price of the whole trip. */
const Itinerary = Schema.Struct({
  price: Schema.Finite,
  flights: Schema.NonEmptyArray(Segment),
  layovers: Schema.optional(Schema.Array(Schema.Unknown)),
  total_duration: Schema.optional(Schema.Finite),
});

const Airline = Schema.Struct({
  code: Schema.String,
  name: Schema.optional(Schema.NullOr(Schema.String)),
  name_translations: Schema.optional(Schema.Struct({ en: Schema.optional(Schema.String) })),
});

/** A hotel as Google Hotels lists it, with its lowest price per night. */
const Hotel = Schema.Struct({
  name: Schema.String,
  rate_per_night: Schema.Struct({ extracted_lowest: Schema.Finite }),
  overall_rating: Schema.optional(Schema.Finite),
  extracted_hotel_class: Schema.optional(Schema.Finite),
});

// Items are decoded one by one, so one malformed place, fare, airline, or hotel does not hide the
// rest.
const ItemList = Schema.Array(Schema.Unknown);

// Travelpayouts answers `data: null` with an `error` text when it has nothing for a request.
const FaresResponse = Schema.Struct({
  data: Schema.optional(Schema.NullOr(ItemList)),
});

// With no results, SerpApi answers 200 with an `error` text and no lists; that counts as none.
const FlightsResponse = Schema.Struct({
  best_flights: Schema.optional(ItemList),
  other_flights: Schema.optional(ItemList),
});

const HotelsResponse = Schema.Struct({
  properties: Schema.optional(ItemList),
});

const decodePlace = Schema.decodeUnknownOption(Place);
const decodeFare = Schema.decodeUnknownOption(Fare);
const decodeItinerary = Schema.decodeUnknownOption(Itinerary);
const decodeAirline = Schema.decodeUnknownOption(Airline);
const decodeHotel = Schema.decodeUnknownOption(Hotel);

/** Cities with their airports. A city without listed airports has one airport with its own code. */
const citiesOf = (places: ReadonlyArray<typeof Place.Type>): ReadonlyArray<TravelCity> => {
  const airportsByCity = new Map<string, Array<string>>();

  for (const place of places) {
    if (place.type !== "airport" || place.city_code === undefined || place.city_code === null) {
      continue;
    }

    const airports = airportsByCity.get(place.city_code) ?? [];

    airports.push(place.code);
    airportsByCity.set(place.city_code, airports);
  }

  return places
    .filter((place) => place.type === "city")
    .map((city) => ({
      code: city.code,
      name: city.name,
      countryCode: city.country_code,
      countryName: city.country_name,
      airports: airportsByCity.get(city.code) ?? [city.code],
    }));
};

/** Airline names by IATA code. An airline without a name keeps its code. */
const airlineNamesOf = (airlines: ReadonlyArray<typeof Airline.Type>) =>
  new Map(
    airlines.flatMap((airline) => {
      const name = airline.name ?? airline.name_translations?.en;

      return name === undefined ? [] : [[airline.code, name] as const];
    }),
  );

/**
 * The prices of each airline, by name: one airline can fly under several codes (easyJet is U2,
 * EC, and DS), and the visitor sees one easyJet.
 */
const pricesByAirline = (
  fares: ReadonlyArray<typeof Fare.Type>,
  names: ReadonlyMap<string, string>,
) => {
  const prices = new Map<string, Array<number>>();

  for (const fare of fares) {
    const airline = names.get(fare.airline) ?? fare.airline;
    const list = prices.get(airline) ?? [];

    list.push(fare.price);
    prices.set(airline, list);
  }

  return prices;
};

const averageOf = (prices: ReadonlyArray<number>) =>
  prices.reduce((sum, price) => sum + price, 0) / prices.length;

/**
 * The average price of a trip both ways, from return fares, or from the average one-way fare out
 * plus the average one-way fare back, whichever stands for more trips: on many routes, travellers
 * search one way at a time. One-way fares stand for as many trips as the direction with fewer
 * fares, so one fare out and one fare back count as one trip, like one return fare. Null below
 * `MIN_FARES` trips: one trip is not an average.
 */
const averageTripOf = (
  returnPrices: ReadonlyArray<number>,
  outPrices: ReadonlyArray<number>,
  backPrices: ReadonlyArray<number>,
): AverageTrip | null => {
  const estimates: Array<AverageTrip> = [];

  if (returnPrices.length > 0) {
    estimates.push({ averageEuros: averageOf(returnPrices), fares: returnPrices.length });
  }

  if (outPrices.length > 0 && backPrices.length > 0) {
    estimates.push({
      averageEuros: averageOf(outPrices) + averageOf(backPrices),
      fares: Math.min(outPrices.length, backPrices.length),
    });
  }

  // The sort is stable, so return fares win a tie.
  const best = estimates.toSorted((first, second) => second.fares - first.fares).at(0);

  if (best === undefined || best.fares < MIN_FARES) return null;

  return { averageEuros: Math.round(best.averageEuros), fares: best.fares };
};

/**
 * The average trip of each airline with enough fares, the cheapest first, and of all airlines
 * together: on long routes the fares spread over many airlines, one or two each.
 */
const averageFaresOf = (found: FoundFares, names: ReadonlyMap<string, string>): FareAverages => {
  const roundTrips = pricesByAirline(found.roundTrips, names);
  const outbound = pricesByAirline(found.outbound, names);
  const inbound = pricesByAirline(found.inbound, names);

  const airlines = new Set([...roundTrips.keys(), ...outbound.keys()]);

  const byAirline = [...airlines]
    .flatMap((airline): Array<AirlineAverage> => {
      const trip = averageTripOf(
        roundTrips.get(airline) ?? [],
        outbound.get(airline) ?? [],
        inbound.get(airline) ?? [],
      );

      return trip === null ? [] : [{ airline, ...trip }];
    })
    .toSorted((first, second) => first.averageEuros - second.averageEuros);

  const allAirlines = averageTripOf(
    found.roundTrips.map((fare) => fare.price),
    found.outbound.map((fare) => fare.price),
    found.inbound.map((fare) => fare.price),
  );

  return { byAirline, allAirlines };
};

/** The airlines of an itinerary, such as "Ryanair" or "TAP Air Portugal + Lufthansa". */
const airlinesOf = (itinerary: typeof Itinerary.Type) =>
  [...new Set(itinerary.flights.map((segment) => segment.airline))].join(" + ");

/** A route, compared by value so the cache recognizes a repeated lookup. */
class RouteQuery extends Data.Class<FareRoute> {}

/** A live flight search, compared by value so the cache recognizes a repeated search. */
class FlightQuery extends Data.Class<{
  readonly origins: string;
  readonly destination: string;
  readonly outboundDate: string;
  readonly returnDate: string;
}> {}

/** A hotel search, compared by value so the cache recognizes a repeated search. */
class HotelQuery extends Data.Class<HotelSearch> {}

const makeTravelData = Effect.gen(function* () {
  const client = yield* HttpClient.HttpClient;

  const faresToken = yield* Config.option(Config.Redacted("TRAVELPAYOUTS_TOKEN"));
  const serpApiKey = yield* Config.option(Config.Redacted("SERPAPI_API_KEY"));

  const getJson = <S extends Schema.Constraint>(
    operation: string,
    request: HttpClientRequest.HttpClientRequest,
    schema: S,
    timeout: Duration.Input,
  ) =>
    client.execute(request).pipe(
      Effect.flatMap(HttpClientResponse.filterStatusOk),
      Effect.flatMap(HttpClientResponse.schemaBodyJson(schema)),
      Effect.timeout(timeout),
      Effect.mapError(
        (error) => new TravelDataError({ operation, cause: describeHttpFailure(error) }),
      ),
      Effect.withSpan(`travelData.${operation}`),
    );

  /**
   * Fares that Aviasales users found for every upcoming date, from Travelpayouts. Without the
   * token it fails: that is a setup problem, not "no fares".
   */
  const searchFares = (origin: string, destination: string, oneWay: boolean) =>
    Option.match(faresToken, {
      onNone: () =>
        Effect.fail(
          new TravelDataError({ operation: "findFares", cause: "TRAVELPAYOUTS_TOKEN is not set" }),
        ),
      onSome: (token) =>
        getJson(
          "findFares",
          HttpClientRequest.get(FARES_URL, {
            urlParams: {
              origin,
              destination,
              one_way: String(oneWay),
              currency: "eur",
              market: FARES_MARKET,
              sorting: "price",
              limit: "1000",
            },
          }).pipe(HttpClientRequest.setHeader("X-Access-Token", Redacted.value(token))),
          FaresResponse,
          FARES_TIMEOUT,
        ).pipe(
          Effect.map((response) =>
            Arr.getSomes((response.data ?? []).map((item) => decodeFare(item))),
          ),
          // The HTTP client can record request headers in traces, and the token is one.
          Effect.provideService(HttpClient.TracerDisabledWhen, () => true),
        ),
    });

  /** A SerpApi search. Without the key it fails: that is a setup problem, not "no results". */
  const searchSerpApi = <S extends Schema.Constraint>(
    operation: string,
    params: Readonly<Record<string, string>>,
    schema: S,
  ): Effect.Effect<S["Type"], TravelDataError, S["DecodingServices"]> =>
    Option.match(serpApiKey, {
      onNone: () =>
        Effect.fail(new TravelDataError({ operation, cause: "SERPAPI_API_KEY is not set" })),
      onSome: (key) =>
        getJson(
          operation,
          HttpClientRequest.get(SERPAPI_URL, {
            urlParams: { ...params, api_key: Redacted.value(key) },
          }),
          schema,
          SERPAPI_TIMEOUT,
        ).pipe(
          // SerpApi only accepts the key in the address, and the HTTP client traces addresses.
          Effect.provideService(HttpClient.TracerDisabledWhen, () => true),
        ),
    });

  const cities = yield* Cache.makeWith(
    (term: string) =>
      getJson(
        "searchCities",
        HttpClientRequest.get(PLACES_URL, {
          urlParams: { term, locale: "en", "types[]": ["city", "airport"] },
        }),
        ItemList,
        PLACES_TIMEOUT,
      ).pipe(Effect.map((items) => citiesOf(Arr.getSomes(items.map((item) => decodePlace(item)))))),
    { capacity: 1000, timeToLive: timeToLive(PLACES_TIME_TO_LIVE) },
  );

  const airlineNames = yield* Cache.makeWith(
    (_language: "en") =>
      getJson("airlineNames", HttpClientRequest.get(AIRLINES_URL), ItemList, FARES_TIMEOUT).pipe(
        Effect.map((items) =>
          airlineNamesOf(Arr.getSomes(items.map((item) => decodeAirline(item)))),
        ),
      ),
    { capacity: 1, timeToLive: timeToLive(AIRLINES_TIME_TO_LIVE) },
  );

  const averageFares = yield* Cache.makeWith(
    (route: RouteQuery) =>
      Effect.all(
        {
          roundTrips: searchFares(route.origin, route.destination, false),
          outbound: searchFares(route.origin, route.destination, true),
          inbound: searchFares(route.destination, route.origin, true),
          names: Cache.get(airlineNames, "en"),
        },
        { concurrency: "unbounded" },
      ).pipe(
        Effect.map((found) =>
          averageFaresOf(
            { roundTrips: found.roundTrips, outbound: found.outbound, inbound: found.inbound },
            found.names,
          ),
        ),
      ),
    { capacity: 500, timeToLive: timeToLive(FARES_TIME_TO_LIVE) },
  );

  const itineraries = yield* Cache.makeWith(
    (query: FlightQuery) =>
      searchSerpApi(
        "findLiveFares",
        {
          engine: "google_flights",
          type: "1",
          departure_id: query.origins,
          arrival_id: query.destination,
          outbound_date: query.outboundDate,
          return_date: query.returnDate,
          currency: "EUR",
          hl: "en",
        },
        FlightsResponse,
      ).pipe(
        Effect.map((response) =>
          Arr.getSomes(
            (response.best_flights ?? [])
              .concat(response.other_flights ?? [])
              .map((item) => decodeItinerary(item)),
          ),
        ),
      ),
    { capacity: 500, timeToLive: timeToLive(FLIGHTS_TIME_TO_LIVE) },
  );

  const hotels = yield* Cache.makeWith(
    (query: HotelQuery) =>
      searchSerpApi(
        "findHotels",
        {
          engine: "google_hotels",
          q: query.place,
          check_in_date: query.checkIn,
          check_out_date: query.checkOut,
          adults: "1",
          currency: "EUR",
          hl: "en",
          gl: "pt",
          sort_by: "3",
          ...HOTEL_FILTERS,
        },
        HotelsResponse,
      ).pipe(
        Effect.map((response) =>
          Arr.getSomes((response.properties ?? []).map((item) => decodeHotel(item))),
        ),
      ),
    { capacity: 200, timeToLive: timeToLive(HOTELS_TIME_TO_LIVE) },
  );

  const findLiveFares = Effect.fn("travelData.findLiveFares")(function* (search: FlightSearch) {
    const found = yield* Cache.get(
      itineraries,
      new FlightQuery({
        origins: search.origins.join(","),
        destination: search.destination,
        outboundDate: search.outboundDate,
        returnDate: search.returnDate,
      }),
    );

    return found
      .map((itinerary): LiveFare => ({
        airline: airlinesOf(itinerary),
        priceEuros: Math.round(itinerary.price),
        stops: itinerary.layovers?.length ?? itinerary.flights.length - 1,
        durationMinutes: itinerary.total_duration ?? null,
      }))
      .toSorted((first, second) => first.priceEuros - second.priceEuros);
  });

  const findHotels = Effect.fn("travelData.findHotels")(function* (search: HotelSearch) {
    const found = yield* Cache.get(hotels, new HotelQuery(search));

    return found
      .map((hotel): HotelOffer => ({
        name: hotel.name,
        pricePerNightEuros: Math.round(hotel.rate_per_night.extracted_lowest),
        stars: hotel.extracted_hotel_class ?? null,
        rating: hotel.overall_rating ?? null,
      }))
      .toSorted((first, second) => first.pricePerNightEuros - second.pricePerNightEuros);
  });

  return TravelData.of({
    searchCities: (term) => Cache.get(cities, term.trim().toLowerCase()),
    findAverageFares: (route) => Cache.get(averageFares, new RouteQuery(route)),
    findLiveFares,
    findHotels,
  });
});

/** A failed or unusable answer from the city search, the fare data, or a SerpApi search. */
export class TravelDataError extends Schema.TaggedError<TravelDataError>()("TravelDataError", {
  operation: Schema.String,
  /** A short description that never includes the request address or a token. */
  cause: Schema.String,
}) {}

/** Cities, average and live flight fares, and live hotel prices for the travel estimator. */
export class TravelData extends Context.Service<TravelData, TravelDataService>()(
  "web/TravelData",
) {}

/**
 * Cities from the Travelpayouts place search, which needs no account; average fares from the
 * fares that Aviasales users found recently, through the free Travelpayouts data API, which needs
 * `TRAVELPAYOUTS_TOKEN`; and live Google Flights and Google Hotels prices through SerpApi, which
 * need `SERPAPI_API_KEY`. Without a token or key, that lookup fails with `TravelDataError` and the
 * travel page shows links instead.
 */
export const TravelDataLive = Layer.effect(TravelData, makeTravelData);

type AverageTrip = {
  readonly averageEuros: number;
  /** How many trips both ways the average stands for (see `averageTripOf`). */
  readonly fares: number;
};

type FoundFares = {
  readonly roundTrips: ReadonlyArray<typeof Fare.Type>;
  readonly outbound: ReadonlyArray<typeof Fare.Type>;
  readonly inbound: ReadonlyArray<typeof Fare.Type>;
};

/** A city with its IATA code and the codes of its airports (London: LHR, LGW, STN, ...). */
export type TravelCity = {
  readonly code: string;
  readonly name: string;
  readonly countryCode: string;
  readonly countryName: string;
  readonly airports: ReadonlyArray<string>;
};

/** A route between two cities or airports, by IATA code. */
export type FareRoute = {
  readonly origin: string;
  readonly destination: string;
};

/**
 * An airline's average price both ways for one adult, from the fares that Aviasales users found
 * in the last 2 to 7 days for upcoming dates. An estimate, not a price to book.
 */
export type AirlineAverage = AverageTrip & {
  readonly airline: string;
};

/** The average prices on a route: per airline, and of all airlines together. */
export type FareAverages = {
  /** Each airline with enough fares, the cheapest first. */
  readonly byAirline: ReadonlyArray<AirlineAverage>;
  /** All airlines together; null when even together there are too few fares. */
  readonly allAirlines: AverageTrip | null;
};

/** A live round-trip fare for one adult in economy, as Google Flights shows it. */
export type LiveFare = {
  readonly airline: string;
  /** The price of the whole round trip. */
  readonly priceEuros: number;
  /** Stops on the way out. */
  readonly stops: number;
  /** The outbound journey time; null when Google Flights does not give it. */
  readonly durationMinutes: number | null;
};

/** A live round-trip search from any of `origins` (airport codes). */
export type FlightSearch = {
  readonly origins: ReadonlyArray<string>;
  readonly destination: string;
  readonly outboundDate: string;
  readonly returnDate: string;
};

/** A live hotel price for one adult, as Google Hotels shows it. */
export type HotelOffer = {
  readonly name: string;
  readonly pricePerNightEuros: number;
  /** The official star rating; null when Google Hotels does not give it. */
  readonly stars: number | null;
  /** The review score out of 5; null when Google Hotels does not give it. */
  readonly rating: number | null;
};

/** A hotel search in `place`, such as "Hotels in Braga, Portugal". */
export type HotelSearch = {
  readonly place: string;
  readonly checkIn: string;
  readonly checkOut: string;
};

/** Lookups for the travel estimator. All fail with `TravelDataError` when the source does. */
export type TravelDataService = {
  /** Cities whose name matches `term`, the most searched first. */
  readonly searchCities: (
    term: string,
  ) => Effect.Effect<ReadonlyArray<TravelCity>, TravelDataError>;
  /** The average prices on the route, from recent fares. Fails without a token. */
  readonly findAverageFares: (route: FareRoute) => Effect.Effect<FareAverages, TravelDataError>;
  /**
   * Live round trips from Google Flights, the cheapest first. Costs one SerpApi search per new
   * search. Empty when Google Flights has none; fails without an API key or when the plan's
   * searches are used up.
   */
  readonly findLiveFares: (
    search: FlightSearch,
  ) => Effect.Effect<ReadonlyArray<LiveFare>, TravelDataError>;
  /**
   * Hotels with 3 stars or more and good reviews, the cheapest first. Empty when none are free;
   * fails without an API key.
   */
  readonly findHotels: (
    search: HotelSearch,
  ) => Effect.Effect<ReadonlyArray<HotelOffer>, TravelDataError>;
};
