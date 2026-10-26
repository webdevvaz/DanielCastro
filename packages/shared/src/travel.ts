import { Effect, Schema, Struct } from "effect";

import { CalendarDate, requiredText } from "./schema-fields";

/** The highest price an admin can enter, in euros. It keeps an extra digit out of the site. */
const MAX_EUROS = 5000;

/** The longest journey from the airport an admin can enter, in minutes. */
const MAX_MINUTES = 600;

const CityText = requiredText("Your city", 80);

/** A form date: empty text, or a calendar date. */
const FormDate = Schema.Union([Schema.Literal(""), CalendarDate]);

/**
 * A trip has both dates or neither, and the client leaves after the day they arrive. A missing
 * date is empty text in the form and an absent value elsewhere.
 */
const tripDatesInOrder = Schema.makeFilter(
  ({
    arrive,
    leave,
  }: {
    readonly arrive?: string | undefined;
    readonly leave?: string | undefined;
  }) => {
    const hasArrive = arrive !== undefined && arrive !== "";
    const hasLeave = leave !== undefined && leave !== "";

    if (!hasArrive && !hasLeave) return true;

    if (!hasArrive)
      return { path: ["arrive"], issue: "Add the day you arrive, or clear both days" };

    if (!hasLeave) return { path: ["leave"], issue: "Add the day you leave, or clear both days" };

    return leave > arrive || { path: ["leave"], issue: "Leave at least one day after you arrive" };
  },
);

/** A whole number in a range, with one message per problem. An empty number input holds NaN. */
const wholeNumber = (label: string, minimum: number, maximum: number) =>
  Schema.Number.check(
    Schema.makeFilter((value: number) => {
      if (Number.isNaN(value)) return `${label} is required`;

      const inRange = Number.isInteger(value) && value >= minimum && value <= maximum;

      return inRange || `${label} must be a whole number from ${minimum} to ${maximum}`;
    }),
  );

/**
 * Every price range runs low to high, with the problem shown on its high field, and the cheapest
 * hotel price cannot be above the typical hotel range.
 */
const pricesInOrder = Schema.makeFilter((prices: SettingsPrices) => {
  const ranges = [
    { low: prices.carDayMinEuros, high: prices.carDayMaxEuros, highField: "carDayMaxEuros" },
    { low: prices.rideMinEuros, high: prices.rideMaxEuros, highField: "rideMaxEuros" },
    {
      low: prices.hotelTypicalMinEuros,
      high: prices.hotelTypicalMaxEuros,
      highField: "hotelTypicalMaxEuros",
    },
  ];

  const reversed = ranges.find(({ low, high }) => low > high);

  if (reversed !== undefined) {
    return { path: [reversed.highField], issue: "The high price must be at least the low price" };
  }

  return (
    prices.hotelFromEuros <= prices.hotelTypicalMinEuros || {
      path: ["hotelFromEuros"],
      issue: "The cheapest price cannot be above the typical range",
    }
  );
});

/** The city a client travels from and, optionally, the days they arrive and leave. */
const TripFields = Schema.Struct({
  from: CityText,
  arrive: Schema.optional(CalendarDate),
  leave: Schema.optional(CalendarDate),
});

const SearchFields = TripFields.mapFields(Struct.assign({ from: Schema.optional(CityText) })).check(
  tripDatesInOrder,
);

/** A trip estimate request. */
export const TravelEstimateInput = TripFields.check(tripDatesInOrder);

/**
 * The travel page's search. `from` is absent until the visitor searches. A search that does not
 * decode, such as an edited address with the dates swapped, becomes no search: the page shows
 * the empty form instead of failing.
 */
export const TravelSearch = Schema.catchDecoding<typeof SearchFields>(() => Effect.succeedSome({}))(
  SearchFields,
);

/** The trip search form. Empty text means no date. */
export const TravelSearchForm = Schema.Struct({
  from: CityText,
  arrive: FormDate,
  leave: FormDate,
}).check(tripDatesInOrder);

/** Text to search city names with, for suggestions while the visitor types. */
export const CitySuggestionsInput = Schema.Struct({
  term: CityText,
});

/**
 * The figures an admin sets for the travel estimator: the ways from Porto airport to Braga (the
 * bus, a rental car, and Uber) and hotels in Braga. `coach*` is the bus.
 */
export const UpdateTravelSettingsInput = Schema.Struct({
  coachFareEuros: wholeNumber("Bus fare", 0, MAX_EUROS),
  coachMinutes: wholeNumber("Bus journey", 1, MAX_MINUTES),
  carDayMinEuros: wholeNumber("Rental car, low", 0, MAX_EUROS),
  carDayMaxEuros: wholeNumber("Rental car, high", 0, MAX_EUROS),
  rideMinEuros: wholeNumber("Uber, low", 0, MAX_EUROS),
  rideMaxEuros: wholeNumber("Uber, high", 0, MAX_EUROS),
  driveMinutes: wholeNumber("Drive time", 1, MAX_MINUTES),
  hotelFromEuros: wholeNumber("Cheapest hotel", 0, MAX_EUROS),
  hotelTypicalMinEuros: wholeNumber("Typical hotel, low", 0, MAX_EUROS),
  hotelTypicalMaxEuros: wholeNumber("Typical hotel, high", 0, MAX_EUROS),
}).check(pricesInOrder);

type SettingsPrices = {
  readonly carDayMinEuros: number;
  readonly carDayMaxEuros: number;
  readonly rideMinEuros: number;
  readonly rideMaxEuros: number;
  readonly hotelFromEuros: number;
  readonly hotelTypicalMinEuros: number;
  readonly hotelTypicalMaxEuros: number;
};

/** Decoded trip estimate request. */
export type TravelEstimateInput = typeof TravelEstimateInput.Type;

/** Decoded travel page search. */
export type TravelSearch = typeof TravelSearch.Type;

/** Trip search form values. */
export type TravelSearchForm = typeof TravelSearchForm.Type;

/** Decoded travel settings. */
export type UpdateTravelSettingsInput = typeof UpdateTravelSettingsInput.Type;
