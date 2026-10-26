import type { TravelEstimateInput } from "@daniel/shared/travel";

import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

import type { getTripEstimate } from "@/server/travel/travel.functions";

import { formatDateRange } from "@/components/format-date-range";

import { cityLabel } from "./city-label";
import { HotelCard } from "./hotel-card";
import {
  AIRPORT_BUS_URL,
  AIRPORT_CAR_RENTAL_URL,
  drivingDirectionsUrl,
  googleFlightsUrl,
  UBER_TO_STUDIO_URL,
} from "./travel-links";
import { euros, formatMinutes, formatNights } from "./trip-format";

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

/** What the flight card says when it has no prices to list. */
const FLIGHT_MESSAGES = {
  loading: "Looking up live prices…",
  none: "No flights found for these dates. Google Flights shows more options.",
  unavailable:
    "Live prices are not available right now. Google Flights shows every flight and its price.",
  past: "These dates have passed. Choose new dates above.",
  unknownCity: "Live prices need a city we know. Google Flights shows every flight.",
} as const;

const formatStops = (stops: number) => {
  if (stops === 0) return "Direct";

  return stops === 1 ? "1 stop" : `${stops} stops`;
};

function FlightOption({ flight }: { flight: Flight }) {
  const details = [formatStops(flight.stops)];

  if (flight.durationMinutes !== null) details.push(formatMinutes(flight.durationMinutes));

  return (
    <li className="trip-flight">
      <div>
        <b>{flight.airline}</b>
        <span>{details.join(" · ")}</span>
      </div>
      <p className="trip-price">
        <b>{euros.format(flight.priceEuros)}</b> both ways
      </p>
    </li>
  );
}

function TripDatesLine({ tripDates }: { tripDates: TripDates }) {
  const range = formatDateRange(tripDates.outbound, tripDates.return);

  if (!tripDates.example) return <p className="field-hint">There and back, {range}</p>;

  return <p className="field-hint">Example trip, {range}. Add your dates for your own prices.</p>;
}

function FlightsCard({ flights, tripDates, searchUrl, status }: FlightsCardProps) {
  const body =
    status === "found" ? (
      <ul className="trip-flights">
        {flights.map((flight) => (
          <FlightOption key={flight.airline} flight={flight} />
        ))}
      </ul>
    ) : (
      <p>{FLIGHT_MESSAGES[status]}</p>
    );

  return (
    <article className="trip-card">
      <h3>Flights to Porto</h3>
      {tripDates === null ? null : <TripDatesLine tripDates={tripDates} />}
      {body}
      <a className="btn btn-ghost btn-small" href={searchUrl} target="_blank" rel="noreferrer">
        Search Google Flights
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
  let bus = "Direct to Braga bus station";
  let car = "Pick it up at the airport";
  let uber = "From the arrivals floor";

  if (settings !== null) {
    const drive = `${formatMinutes(settings.driveMinutes)} each way`;
    const carDays = days === 1 ? "1 day" : `${days} days`;

    bus = `${euros.format(2 * settings.coachFareEuros)} both ways · ${formatMinutes(settings.coachMinutes)} each way`;
    car = `${euros.format(days * settings.carDayMinEuros)}–${euros.format(days * settings.carDayMaxEuros)} for ${carDays}, plus tolls · ${drive}`;
    uber = `About ${euros.format(2 * settings.rideMinEuros)}–${euros.format(2 * settings.rideMaxEuros)} both ways · ${drive}`;
  }

  return (
    <article className="trip-card">
      <h3>Porto airport to Braga</h3>
      <ul className="trip-options">
        <TransportOption name="Bus" details={bus} link={AIRPORT_BUS_URL} linkLabel="Get Bus" />
        <TransportOption
          name="Rental car"
          details={car}
          link={AIRPORT_CAR_RENTAL_URL}
          linkLabel="Compare"
        />
        <TransportOption
          name="Uber"
          details={uber}
          link={UBER_TO_STUDIO_URL}
          linkLabel="Open Uber"
        />
      </ul>
    </article>
  );
}

function DriveCard({ from }: { from: string }) {
  return (
    <article className="trip-card">
      <h3>By car</h3>
      <p>From {from}, driving can be the simplest way to the studio.</p>
      <a
        className="btn btn-ghost btn-small"
        href={drivingDirectionsUrl(from)}
        target="_blank"
        rel="noreferrer"
      >
        Open Google Maps
      </a>
    </article>
  );
}

function TotalLine({ estimate }: { estimate: Estimate }) {
  if (estimate.total === null) return null;

  const nights = formatNights(estimate.nights);
  const hotel =
    estimate.hotelAverage === null
      ? `${nights} in a hotel at typical prices`
      : `${nights} at the average hotel price`;
  const parts = `The flight and the bus both ways, and ${hotel}.`;

  return (
    <div className="trip-total">
      <p>Estimated total for one person</p>
      <p className="trip-total-range">
        {euros.format(estimate.total.minEuros)} – {euros.format(estimate.total.maxEuros)}
      </p>
      <p className="field-hint">
        {estimate.tripDates.example ? `${parts} For the example trip.` : parts}
      </p>
    </div>
  );
}

/** Why the estimate has no prices, when that is not plain from the cards. */
function TripStatus({ failed, unknownCity, typed }: TripStatusProps) {
  if (failed) {
    return (
      <p className="trip-status" role="alert">
        Prices are not available right now. The links below still work.
      </p>
    );
  }

  if (!unknownCity) return null;

  return (
    <p className="trip-status">
      We do not know “{typed}” yet. The links below still search for it, or try the nearest large
      city.
    </p>
  );
}

/**
 * The trip estimate for a search. The links work from what the visitor typed, so they show while
 * the prices load and when no prices exist.
 */
export function TripEstimate({ input }: { input: TravelEstimateInput }) {
  const context = useRouteContext({ from: "/_site/travel" });

  const { data: estimate, isPending, isError } = useQuery(context.tripEstimateQueryOptions(input));

  const shown = shownEstimateOf(estimate, isPending);
  const from = shown.city === null ? input.from : cityLabel(shown.city);

  // Google Flights and Booking.com open on the dates the prices are for, so the visitor sees the
  // same prices.
  const priced =
    shown.tripDates === null
      ? { from, arrive: input.arrive, leave: input.leave }
      : { from, arrive: shown.tripDates.outbound, leave: shown.tripDates.return };

  let heading = `From ${from}`;

  if (input.arrive !== undefined && input.leave !== undefined) {
    heading = `${heading}, ${formatDateRange(input.arrive, input.leave)}`;
  }

  return (
    <section className="trip" aria-labelledby="trip-heading" aria-busy={isPending}>
      <h2 id="trip-heading">{heading}</h2>

      <TripStatus failed={isError} unknownCity={shown.unknownCity} typed={input.from} />

      <div className="trip-grid">
        <FlightsCard
          flights={shown.flights}
          tripDates={shown.tripDates}
          searchUrl={googleFlightsUrl(priced)}
          status={shown.flightStatus}
        />
        <AirportCard settings={shown.settings} days={shown.nights} />
        <HotelCard
          status={shown.hotelStatus}
          hotels={shown.hotels}
          average={shown.hotelAverage}
          nights={shown.nights}
          settings={shown.settings}
          stay={priced}
        />
        {shown.canDrive ? <DriveCard from={from} /> : null}
      </div>

      {estimate === undefined ? null : <TotalLine estimate={estimate} />}

      <p className="trip-note">
        Flight and hotel prices are live from Google, for one adult. Transport prices are typical
        prices. Prices change, so check them before you book. Book your travel only after your date
        is confirmed and your deposit is paid.
      </p>
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

type FlightsCardProps = {
  readonly flights: ReadonlyArray<Flight>;
  readonly tripDates: TripDates | null;
  readonly searchUrl: string;
  readonly status: Estimate["flightStatus"] | "loading";
};
