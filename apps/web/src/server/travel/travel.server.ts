import "@tanstack/react-start/server-only";
import type { TravelEstimateInput, UpdateTravelSettingsInput } from "@daniel/shared/travel";

import { getTravelSettings, saveTravelSettings, type TravelSettingsValues } from "@daniel/db";
import { studioToday } from "@daniel/shared/studio";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { Effect } from "effect";

import { cityLabel } from "@/travel/city-label";

import { withAuditEvent } from "../observability/audit.server";
import {
  TravelData,
  type FlightFare,
  type HotelOffer,
  type TravelCity,
  type TravelDataError,
} from "./travel-data.server";

/** Porto airport, the nearest airport with international flights. Braga has none. */
const DESTINATION = "OPO";

/** Without dates, a client arrives the day before the session and leaves the day after. */
const DEFAULT_NIGHTS = 2;

/**
 * Google Flights needs dates. Without the visitor's dates, the estimate prices an example trip
 * this far ahead, which is far enough for normal fares and close enough to be bookable.
 */
const EXAMPLE_TRIP_DAYS_AHEAD = 28;

/** Where clients stay: Google Hotels reads the place as text. */
const HOTEL_PLACE = "Hotels in Braga, Portugal";

const MAX_FLIGHT_OPTIONS = 3;
const MAX_HOTEL_OPTIONS = 3;
const MAX_CITY_SUGGESTIONS = 6;

/** Countries close enough to drive to the studio. */
const DRIVING_COUNTRY_CODES: ReadonlySet<string> = new Set(["PT", "ES"]);

/** The name to search for: "London, United Kingdom" (a picked suggestion) searches "London". */
const searchTermOf = (text: string) => {
  const comma = text.indexOf(",");

  return comma === -1 ? text : text.slice(0, comma).trim();
};

/** The suggestion the visitor picked, when the text matches one exactly; else the best match. */
const pickCity = (text: string, cities: ReadonlyArray<TravelCity>) =>
  cities.find((city) => cityLabel(city) === text) ?? cities.at(0) ?? null;

const calendarDate = (date: Date) => format(date, "yyyy-MM-dd");

/** The visitor's dates, or an example trip of `DEFAULT_NIGHTS` nights when they gave none. */
const tripDatesOf = (input: TravelEstimateInput, today: string) => {
  if (input.arrive !== undefined && input.leave !== undefined) {
    return { outbound: input.arrive, return: input.leave, example: false };
  }

  const outbound = addDays(parseISO(today), EXAMPLE_TRIP_DAYS_AHEAD);

  return {
    outbound: calendarDate(outbound),
    return: calendarDate(addDays(outbound, DEFAULT_NIGHTS)),
    example: true,
  };
};

/** The cheapest fare of each airline, so the options differ; at most three. */
const flightOptions = (fares: ReadonlyArray<FlightFare>) => {
  const airlines = new Set<string>();
  const options: Array<FlightFare> = [];

  for (const fare of fares) {
    if (options.length === MAX_FLIGHT_OPTIONS) break;

    if (airlines.has(fare.airline)) continue;

    airlines.add(fare.airline);
    options.push(fare);
  }

  return options;
};

/** The average price per night of the hotels shown, or null when there are none. */
const averageNightOf = (hotels: ReadonlyArray<HotelOffer>) => {
  if (hotels.length === 0) return null;

  const sum = hotels.reduce((total, hotel) => total + hotel.pricePerNightEuros, 0);

  return Math.round(sum / hotels.length);
};

/**
 * The trip cost for one person: the flight, the bus both ways, and the hotel nights. The low end
 * uses the cheapest flight, the high end the dearest flight shown. The hotel nights use the live
 * average of the cheapest hotels, or the admin's typical range when there are no live prices.
 * Null when a part is missing, because a partial total misleads.
 */
const tripTotal = (
  flights: ReadonlyArray<FlightFare>,
  settings: TravelSettingsValues | null,
  nights: number,
  hotelAverage: number | null,
) => {
  const cheapest = flights.at(0);
  const dearest = flights.at(-1);

  if (cheapest === undefined || dearest === undefined || settings === null) return null;

  const busBothWays = 2 * settings.coachFareEuros;
  const nightLow = hotelAverage ?? settings.hotelTypicalMinEuros;
  const nightHigh = hotelAverage ?? settings.hotelTypicalMaxEuros;

  return {
    minEuros: cheapest.priceEuros + busBothWays + nights * nightLow,
    maxEuros: dearest.priceEuros + busBothWays + nights * nightHigh,
  };
};

/** A source being down or slow must not break the page: the estimate falls back to links. */
const orWhenUnavailable =
  <A>(fallback: A) =>
  <R>(effect: Effect.Effect<A, TravelDataError, R>) =>
    effect.pipe(
      Effect.catchTag("TravelDataError", (error) =>
        Effect.logWarning("Travel data is not available").pipe(
          Effect.annotateLogs({ "travel.operation": error.operation, "travel.cause": error.cause }),
          Effect.as(fallback),
        ),
      ),
    );

/** The live fares for the trip, and why there are none when there are none. */
const findFlights = Effect.fn("findFlights")(function* (
  city: TravelCity | null,
  citySearchFailed: boolean,
  tripDates: TripDates,
  today: string,
) {
  if (city === null) {
    return {
      status: citySearchFailed ? "unavailable" : "unknownCity",
      fares: [],
    } satisfies FlightSearch;
  }

  // Every flight search costs money; a trip that has already started has no fares to find.
  if (tripDates.outbound < today) return { status: "past", fares: [] } satisfies FlightSearch;

  const travelData = yield* TravelData;

  return yield* travelData
    .findFares({
      origins: city.airports,
      destination: DESTINATION,
      outboundDate: tripDates.outbound,
      returnDate: tripDates.return,
    })
    .pipe(
      Effect.map((fares): FlightSearch => ({
        status: fares.length === 0 ? "none" : "found",
        fares,
      })),
      orWhenUnavailable<FlightSearch>({ status: "unavailable", fares: [] }),
    );
});

/** The cheapest live hotels for the stay, and why there are none when there are none. */
const findStay = Effect.fn("findStay")(function* (tripDates: TripDates, today: string) {
  // Every hotel search costs money; a stay that has already started has no rooms to find.
  if (tripDates.outbound < today) return { status: "past", hotels: [] } satisfies StaySearch;

  const travelData = yield* TravelData;

  return yield* travelData
    .findHotels({ place: HOTEL_PLACE, checkIn: tripDates.outbound, checkOut: tripDates.return })
    .pipe(
      Effect.map((hotels): StaySearch => ({
        status: hotels.length === 0 ? "none" : "found",
        hotels: hotels.slice(0, MAX_HOTEL_OPTIONS),
      })),
      orWhenUnavailable<StaySearch>({ status: "unavailable", hotels: [] }),
    );
});

/**
 * A trip estimate from the visitor's city to the studio. Each part is optional: no city match,
 * no fares, no hotel prices, or no admin figures leave that part out, and the page shows the
 * links instead.
 */
export const estimateTrip = Effect.fn("estimateTrip")(function* (input: TravelEstimateInput) {
  const travelData = yield* TravelData;

  // Null when the city search failed, which is not the same as a city nobody knows.
  const cities = yield* travelData
    .searchCities(searchTermOf(input.from))
    .pipe(orWhenUnavailable<ReadonlyArray<TravelCity> | null>(null));

  const city = cities === null ? null : pickCity(input.from, cities);

  const today = studioToday();
  const tripDates = tripDatesOf(input, today);

  // The two searches take seconds each and do not depend on each other.
  const [flightSearch, staySearch] = yield* Effect.all(
    [findFlights(city, cities === null, tripDates, today), findStay(tripDates, today)],
    { concurrency: "unbounded" },
  );

  const settings = yield* getTravelSettings();

  const nights = differenceInCalendarDays(parseISO(tripDates.return), parseISO(tripDates.outbound));
  const flights = flightOptions(flightSearch.fares);
  const hotelAverage = averageNightOf(staySearch.hotels);

  return {
    city,
    unknownCity: cities !== null && city === null,
    canDrive: city !== null && DRIVING_COUNTRY_CODES.has(city.countryCode),
    tripDates,
    flightStatus: flightSearch.status,
    flights,
    hotelStatus: staySearch.status,
    hotels: staySearch.hotels,
    hotelAverage,
    settings,
    nights,
    total: tripTotal(flights, settings, nights, hotelAverage),
  };
});

/** City suggestions for the travel form. Empty when the city search is not available. */
export const suggestCities = Effect.fn("suggestCities")(function* (term: string) {
  const travelData = yield* TravelData;

  const cities = yield* travelData
    .searchCities(term)
    .pipe(orWhenUnavailable<ReadonlyArray<TravelCity>>([]));

  return cities.slice(0, MAX_CITY_SUGGESTIONS).map(cityLabel);
});

/** Saves the travel estimator's figures. */
export const updateTravelSettings = Effect.fn("updateTravelSettings")(
  function* (_userId: string, input: UpdateTravelSettingsInput) {
    yield* saveTravelSettings(input);
  },
  (effect, userId) =>
    effect.pipe(
      withAuditEvent({
        action: "travel.settings_updated",
        actorUserId: userId,
        targetType: "travel_settings",
      }),
    ),
);

type TripDates = ReturnType<typeof tripDatesOf>;

/**
 * Live fares and why the flight card shows what it shows: `found`, `none` (Google Flights has no
 * flights), `unavailable` (no API key, or the search failed), `past` (the dates have passed), or
 * `unknownCity`.
 */
type FlightSearch = {
  readonly status: "found" | "none" | "unavailable" | "past" | "unknownCity";
  readonly fares: ReadonlyArray<FlightFare>;
};

/** The cheapest live hotels for the stay, with the same statuses as `FlightSearch`. */
type StaySearch = {
  readonly status: "found" | "none" | "unavailable" | "past";
  readonly hotels: ReadonlyArray<HotelOffer>;
};
