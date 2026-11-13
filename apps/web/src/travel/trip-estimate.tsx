import type { TravelEstimateInput } from "@daniel/shared/travel";

import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

import type { getTripEstimate } from "@/server/travel/travel.functions";

import { formatDateRange } from "@/components/format-date-range";
import { useLocale } from "@/i18n/use-locale";

import { cityLabel } from "./city-label";
import { HotelCard } from "./hotel-card";
import {
  AIRPORT_BUS_URL,
  AIRPORT_CAR_RENTAL_URL,
  drivingDirectionsUrl,
  googleFlightsUrl,
  UBER_TO_STUDIO_URL,
} from "./travel-links";
import { TRAVEL_TEXT } from "./travel-text";
import { euroRange, eurosIn, formatMinutes } from "./trip-format";

/**
 * What the cards show. While the estimate loads, or when it failed, there is no city match and
 * no prices, so the cards show their links only.
 */
const shownEstimateOf = (estimate: Estimate | undefined, loading: boolean) => {
  if (estimate === undefined) {
    const status = loading ? "loading" : "unavailable";

    return {
      city: null,
      tripDates: null,
      flightStatus: status,
      flights: [],
      hotelStatus: status,
      hotels: [],
      hotelAverage: null,
      settings: null,
      nights: 1,
      canDrive: false,
      unknownCity: false,
    } as const;
  }

  return {
    city: estimate.city,
    tripDates: estimate.tripDates,
    flightStatus: estimate.flightStatus,
    flights: estimate.flights,
    hotelStatus: estimate.hotelStatus,
    hotels: estimate.hotels,
    hotelAverage: estimate.hotelAverage,
    settings: estimate.settings,
    nights: estimate.nights,
    canDrive: estimate.canDrive,
    unknownCity: estimate.unknownCity,
  };
};

/** An average from recent fares, or a live fare with its stops and journey time. */
function FlightOption({ flight }: { flight: Flight }) {
  const locale = useLocale();
  const t = TRAVEL_TEXT[locale].flights;

  const details = [flight.source === "average" ? t.averageBothWays : t.bothWays];

  if (flight.stops !== null) details.push(flight.stops === 0 ? t.direct : t.stops(flight.stops));

  if (flight.durationMinutes !== null) {
    details.push(formatMinutes(flight.durationMinutes, locale));
  }

  return (
    <li className="trip-flight">
      <div>
        <b>{flight.airline ?? t.allAirlines}</b>
        <span>{details.join(" · ")}</span>
      </div>
      <p className="trip-price">
        {flight.source === "average" ? `${t.about} ` : null}
        <b>{eurosIn(locale).format(flight.priceEuros)}</b>
      </p>
    </li>
  );
}

/** Where the listed prices come from. */
function FlightSourceLine({ status, tripDates }: FlightSourceLineProps) {
  const locale = useLocale();
  const t = TRAVEL_TEXT[locale].flights;

  if (status !== "live") return <p className="field-hint">{t.recentFares}</p>;

  if (tripDates === null) return null;

  const range = formatDateRange(tripDates.outbound, tripDates.return, locale);

  return <p className="field-hint">{tripDates.example ? t.liveExample(range) : t.live(range)}</p>;
}

/**
 * The flight prices, and the Google Flights search for the visitor's dates below them. Most
 * routes show the average price of each airline from recent fares; a less common route shows live
 * Google Flights prices.
 */
function FlightsCard({ flights, tripDates, searchUrl, status }: FlightsCardProps) {
  const t = TRAVEL_TEXT[useLocale()].flights;

  const body =
    status === "averages" || status === "live" ? (
      <>
        <FlightSourceLine status={status} tripDates={tripDates} />
        <ul className="trip-flights">
          {flights.map((flight) => (
            <FlightOption key={flight.airline ?? "all"} flight={flight} />
          ))}
        </ul>
      </>
    ) : (
      <p>{t[status]}</p>
    );

  return (
    <article className="trip-card">
      <h3>{t.title}</h3>
      {body}
      <a className="btn btn-ghost btn-small" href={searchUrl} target="_blank" rel="noreferrer">
        {t.search}
      </a>
    </article>
  );
}

function TransportOption({ name, details, link, linkLabel }: TransportOptionProps) {
  return (
    <li className="trip-option">
      <div>
        <b>{name}</b>
        <span>{details}</span>
      </div>
      <a href={link} target="_blank" rel="noreferrer">
        {linkLabel}
      </a>
    </li>
  );
}

/**
 * The ways from the airport to Braga and back, priced for the whole trip like the flight: the
 * bus and Uber both ways, the rental car for the days of the stay. Without admin figures, only
 * the options and their links show.
 */
function AirportCard({ settings, days }: AirportCardProps) {
  const locale = useLocale();
  const t = TRAVEL_TEXT[locale].airport;

  let bus = t.busDefault;
  let car = t.carDefault;
  let uber = t.uberDefault;

  if (settings !== null) {
    const drive = t.eachWay(formatMinutes(settings.driveMinutes, locale));
    const carRange = euroRange(
      locale,
      days * settings.carDayMinEuros,
      days * settings.carDayMaxEuros,
    );
    const uberRange = euroRange(locale, 2 * settings.rideMinEuros, 2 * settings.rideMaxEuros);

    bus = t.busDetails(
      eurosIn(locale).format(2 * settings.coachFareEuros),
      formatMinutes(settings.coachMinutes, locale),
    );
    car = t.carDetails(carRange, t.days(days), drive);
    uber = t.uberDetails(uberRange, drive);
  }

  return (
    <article className="trip-card">
      <h3>{t.title}</h3>
      <ul className="trip-options">
        <TransportOption name={t.bus} details={bus} link={AIRPORT_BUS_URL} linkLabel={t.getBus} />
        <TransportOption
          name={t.car}
          details={car}
          link={AIRPORT_CAR_RENTAL_URL}
          linkLabel={t.compare}
        />
        <TransportOption
          name={t.uber}
          details={uber}
          link={UBER_TO_STUDIO_URL}
          linkLabel={t.openUber}
        />
      </ul>
    </article>
  );
}

function DriveCard({ from }: { from: string }) {
  const t = TRAVEL_TEXT[useLocale()].drive;

  return (
    <article className="trip-card">
      <h3>{t.title}</h3>
      <p>{t.text(from)}</p>
      <a
        className="btn btn-ghost btn-small"
        href={drivingDirectionsUrl(from)}
        target="_blank"
        rel="noreferrer"
      >
        {t.open}
      </a>
    </article>
  );
}

function TotalLine({ estimate }: { estimate: Estimate }) {
  const locale = useLocale();
  const text = TRAVEL_TEXT[locale];

  if (estimate.total === null) return null;

  const nights = text.nights(estimate.nights);
  const hotel =
    estimate.hotelAverage === null
      ? text.total.hotelTypical(nights)
      : text.total.hotelAverage(nights);
  const flight =
    estimate.flightStatus === "live" ? text.total.flightLive : text.total.flightAverage;
  const parts = text.total.parts(flight, hotel);

  return (
    <div className="trip-total">
      <p>{text.total.label}</p>
      <p className="trip-total-range">
        {euroRange(locale, estimate.total.minEuros, estimate.total.maxEuros)}
      </p>
      <p className="field-hint">
        {estimate.tripDates.example ? `${parts} ${text.total.example}` : parts}
      </p>
    </div>
  );
}

/** Why the estimate has no prices, when that is not plain from the cards. */
function TripStatus({ failed, unknownCity, typed }: TripStatusProps) {
  const t = TRAVEL_TEXT[useLocale()];

  if (failed) {
    return (
      <p className="trip-status" role="alert">
        {t.failed}
      </p>
    );
  }

  if (!unknownCity) return null;

  return <p className="trip-status">{t.unknownCity(typed)}</p>;
}

/**
 * The trip estimate for a search. The links work from what the visitor typed, so they show while
 * the prices load and when no prices exist.
 */
export function TripEstimate({ input }: { input: TravelEstimateInput }) {
  const context = useRouteContext({ from: "/{-$locale}/_site/travel" });
  const locale = useLocale();
  const t = TRAVEL_TEXT[locale];

  const { data: estimate, isPending, isError } = useQuery(context.tripEstimateQueryOptions(input));

  const shown = shownEstimateOf(estimate, isPending);
  const from = shown.city === null ? input.from : cityLabel(shown.city);

  // Google Flights and Booking.com open on the dates the prices are for, so the visitor sees the
  // same prices.
  const priced =
    shown.tripDates === null
      ? { from, arrive: input.arrive, leave: input.leave }
      : { from, arrive: shown.tripDates.outbound, leave: shown.tripDates.return };

  let heading = t.heading(from);

  if (input.arrive !== undefined && input.leave !== undefined) {
    heading = `${heading}, ${formatDateRange(input.arrive, input.leave, locale)}`;
  }

  return (
    <section className="trip" aria-labelledby="trip-heading" aria-busy={isPending}>
      <h2 id="trip-heading">{heading}</h2>

      <TripStatus failed={isError} unknownCity={shown.unknownCity} typed={input.from} />

      <div className="trip-grid">
        <FlightsCard
          flights={shown.flights}
          tripDates={shown.tripDates}
          searchUrl={googleFlightsUrl(priced, locale)}
          status={shown.flightStatus}
        />
        <AirportCard settings={shown.settings} days={shown.nights} />
        <HotelCard
          status={shown.hotelStatus}
          hotels={shown.hotels}
          average={shown.hotelAverage}
          nights={shown.nights}
          settings={shown.settings}
          tripDates={shown.tripDates}
          stay={priced}
        />
        {shown.canDrive ? <DriveCard from={from} /> : null}
      </div>

      {estimate === undefined ? null : <TotalLine estimate={estimate} />}

      <p className="trip-note">{t.note}</p>
    </section>
  );
}

type Estimate = Awaited<ReturnType<typeof getTripEstimate>>;

type Flight = Estimate["flights"][number];

type Settings = NonNullable<Estimate["settings"]>;

type TripDates = Estimate["tripDates"];

type AirportCardProps = {
  readonly settings: Settings | null;
  /** Rental days: one per night of the stay, from the day the visitor lands. */
  readonly days: number;
};

type TransportOptionProps = {
  readonly name: string;
  readonly details: string;
  readonly link: string;
  readonly linkLabel: string;
};

type TripStatusProps = {
  readonly failed: boolean;
  readonly unknownCity: boolean;
  readonly typed: string;
};

type FlightSourceLineProps = {
  readonly status: "averages" | "live";
  readonly tripDates: TripDates | null;
};

type FlightsCardProps = {
  readonly flights: ReadonlyArray<Flight>;
  /** The dates of live prices; null while the estimate loads. */
  readonly tripDates: TripDates | null;
  /** Google Flights for the visitor's dates, or for the example trip. */
  readonly searchUrl: string;
  readonly status: Estimate["flightStatus"] | "loading";
};
