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
const SERPAPI_URL = "https://serpapi.com/search.json";

/** City search runs while the visitor types, so a slow answer counts as no answer. */
const PLACES_TIMEOUT = "6 seconds";

/** A Google search through SerpApi takes 2 to 6 seconds; the page shows links meanwhile. */
const SERPAPI_TIMEOUT = "15 seconds";

/** Each new price search costs one SerpApi search, so a repeated search reuses the answer. */
const PRICES_TIME_TO_LIVE = "6 hours";
const PLACES_TIME_TO_LIVE = "1 day";

/** A failed lookup is retried soon, but not on every page view. */
const FAILURE_TIME_TO_LIVE = "1 minute";

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

const Segment = Schema.Struct({
  airline: Schema.String,
  departure_airport: Schema.Struct({ time: Schema.String }),
});

/** A round trip as Google Flights lists it: the outbound flights and the price of the whole trip. */
const Itinerary = Schema.Struct({
  price: Schema.Number,
  flights: Schema.NonEmptyArray(Segment),
  layovers: Schema.optional(Schema.Array(Schema.Unknown)),
  total_duration: Schema.optional(Schema.Number),
});

/** A hotel as Google Hotels lists it, with its lowest price per night. */
const Hotel = Schema.Struct({
  name: Schema.String,
  rate_per_night: Schema.Struct({ extracted_lowest: Schema.Number }),
  overall_rating: Schema.optional(Schema.Number),
  extracted_hotel_class: Schema.optional(Schema.Number),
});

// Items are decoded one by one, so one malformed place, itinerary, or hotel does not hide the rest.
const ItemList = Schema.Array(Schema.Unknown);

// With no results, SerpApi answers 200 with an `error` text and no lists; that counts as none.
const FlightsResponse = Schema.Struct({
  best_flights: Schema.optional(ItemList),
  other_flights: Schema.optional(ItemList),
});

const HotelsResponse = Schema.Struct({
  properties: Schema.optional(ItemList),
});

const decodePlace = Schema.decodeUnknownOption(Place);
const decodeItinerary = Schema.decodeUnknownOption(Itinerary);
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

/** The airlines of an itinerary, such as "Ryanair" or "TAP Air Portugal + Lufthansa". */
const airlinesOf = (itinerary: typeof Itinerary.Type) =>
  [...new Set(itinerary.flights.map((segment) => segment.airline))].join(" + ");

/** A fare search, compared by value so the cache recognizes a repeated search. */
class FareQuery extends Data.Class<{
  readonly origins: string;
  readonly destination: string;
  readonly outboundDate: string;
  readonly returnDate: string;
}> {}

/** A hotel search, compared by value so the cache recognizes a repeated search. */
class HotelQuery extends Data.Class<HotelSearch> {}

const makeTravelData = Effect.gen(function* () {
  const client = yield* HttpClient.HttpClient;

  const apiKey = yield* Config.option(Config.Redacted("SERPAPI_API_KEY"));

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

  /** A SerpApi search. Without the key it fails: that is a setup problem, not "no results". */
  const searchSerpApi = <S extends Schema.Constraint>(
    operation: string,
    params: Readonly<Record<string, string>>,
    schema: S,
  ): Effect.Effect<S["Type"], TravelDataError, S["DecodingServices"]> =>
    Option.match(apiKey, {
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

  const itineraries = yield* Cache.makeWith(
    (query: FareQuery) =>
      searchSerpApi(
        "findFares",
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
    { capacity: 500, timeToLive: timeToLive(PRICES_TIME_TO_LIVE) },
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
    { capacity: 200, timeToLive: timeToLive(PRICES_TIME_TO_LIVE) },
  );

  const findFares = Effect.fn("travelData.findFares")(function* (search: FareSearch) {
    const found = yield* Cache.get(
      itineraries,
      new FareQuery({
        origins: search.origins.join(","),
        destination: search.destination,
        outboundDate: search.outboundDate,
        returnDate: search.returnDate,
      }),
    );

    return found
      .map((itinerary): FlightFare => ({
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
    findFares,
    findHotels,
  });
});

/** A failed or unusable answer from the city search, the flight search, or the hotel search. */
export class TravelDataError extends Schema.TaggedError<TravelDataError>()("TravelDataError", {
  operation: Schema.String,
  /** A short description that never includes the request address. */
  cause: Schema.String,
}) {}

/** Cities, live flight fares, and live hotel prices for the travel estimator. */
export class TravelData extends Context.Service<TravelData, TravelDataService>()(
  "web/TravelData",
) {}

/**
 * Cities from the Travelpayouts place search, which needs no account, and live Google Flights
 * and Google Hotels prices through SerpApi, which need `SERPAPI_API_KEY`. Without the key, every
 * price search fails with `TravelDataError` and the travel page shows links only.
 */
export const TravelDataLive = Layer.effect(TravelData, makeTravelData);

/** A city with its IATA code and the codes of its airports (London: LHR, LGW, STN, ...). */
export type TravelCity = {
  readonly code: string;
  readonly name: string;
  readonly countryCode: string;
  readonly countryName: string;
  readonly airports: ReadonlyArray<string>;
};

/** A live round-trip fare for one adult in economy, as Google Flights shows it. */
export type FlightFare = {
  readonly airline: string;
  /** The price of the whole round trip. */
  readonly priceEuros: number;
  /** Stops on the way out. */
  readonly stops: number;
  /** The outbound journey time; null when Google Flights does not give it. */
  readonly durationMinutes: number | null;
};

/** A round-trip fare search from any of `origins` (airport codes). */
export type FareSearch = {
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
  /** Round trips, the cheapest first. Empty when no flights exist; fails without an API key. */
  readonly findFares: (
    search: FareSearch,
  ) => Effect.Effect<ReadonlyArray<FlightFare>, TravelDataError>;
  /**
   * Hotels with 3 stars or more and good reviews, the cheapest first. Empty when none are free;
   * fails without an API key.
   */
  readonly findHotels: (
    search: HotelSearch,
  ) => Effect.Effect<ReadonlyArray<HotelOffer>, TravelDataError>;
};
