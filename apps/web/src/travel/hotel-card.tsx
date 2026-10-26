import type { getTripEstimate } from "@/server/travel/travel.functions";

import { bookingHotelUrl, bookingUrl } from "./travel-links";
import { euros, formatNights } from "./trip-format";

/** What the hotel card says when it has no live prices to list. */
const HOTEL_MESSAGES = {
  loading: "Looking up live hotel prices…",
  none: "No rooms found for these dates.",
  unavailable: "Live hotel prices are not available right now.",
  past: "These dates have passed.",
} as const;

function HotelOption({ hotel, stay }: HotelOptionProps) {
  const details = [`${euros.format(hotel.pricePerNightEuros)} a night`];

  if (hotel.stars !== null) details.push(`${hotel.stars} stars`);

  if (hotel.rating !== null) details.push(`rated ${hotel.rating.toFixed(1)}`);

  return (
    <li className="trip-option">
      <div>
        <b>{hotel.name}</b>
        <span>{details.join(" · ")}</span>
      </div>
      <a href={bookingHotelUrl(hotel.name, stay)} target="_blank" rel="noreferrer">
        Booking.com
      </a>
    </li>
  );
}

/** The live hotels and their average, for the nights of the stay. */
function LiveHotels({ hotels, average, nights, stay }: LiveHotelsProps) {
  return (
    <>
      <p className="field-hint">The cheapest with 3 stars or more and good reviews.</p>
      <ul className="trip-options">
        {hotels.map((hotel) => (
          <HotelOption key={hotel.name} hotel={hotel} stay={stay} />
        ))}
      </ul>
      <p>
        Average <b>{euros.format(average)}</b> a night,{" "}
        <span className="trip-range">{euros.format(average * nights)}</span> for{" "}
        {formatNights(nights)}.
      </p>
    </>
  );
}

/**
 * Hotels in Braga: the cheapest good hotels with live prices and their average, or the admin's
 * typical prices when live prices are not available.
 */
export function HotelCard({ status, hotels, average, nights, settings, stay }: HotelCardProps) {
  // There is an average exactly when live hotels were found.
  const live = average === null ? null : { hotels, average };
  const typical = live === null && status !== "loading" ? settings : null;

  return (
    <article className="trip-card">
      <h3>Stay in Braga</h3>
      {live === null ? (
        <p>{HOTEL_MESSAGES[status === "found" ? "none" : status]}</p>
      ) : (
        <LiveHotels hotels={live.hotels} average={live.average} nights={nights} stay={stay} />
      )}
      {typical === null ? null : (
        <p>
          Hotels from <b>{euros.format(typical.hotelFromEuros)}</b> a night; most cost{" "}
          <span className="trip-range">
            {euros.format(typical.hotelTypicalMinEuros)}–
            {euros.format(typical.hotelTypicalMaxEuros)}
          </span>
          .
        </p>
      )}
      <a
        className="btn btn-ghost btn-small"
        href={bookingUrl(stay)}
        target="_blank"
        rel="noreferrer"
      >
        Search Booking.com
      </a>
    </article>
  );
}

type Estimate = Awaited<ReturnType<typeof getTripEstimate>>;

type Hotel = Estimate["hotels"][number];

type Stay = {
  readonly from: string;
  readonly arrive?: string | undefined;
  readonly leave?: string | undefined;
};

type HotelOptionProps = {
  readonly hotel: Hotel;
  readonly stay: Stay;
};

type LiveHotelsProps = {
  readonly hotels: ReadonlyArray<Hotel>;
  readonly average: number;
  readonly nights: number;
  readonly stay: Stay;
};

type HotelCardProps = {
  readonly status: Estimate["hotelStatus"] | "loading";
  readonly hotels: ReadonlyArray<Hotel>;
  /** The average price per night of `hotels`; null when there are none. */
  readonly average: number | null;
  readonly nights: number;
  /** The admin's typical prices, shown when there are no live prices. */
  readonly settings: Estimate["settings"];
  /** The dates the prices are for, so Booking.com opens on the same nights. */
  readonly stay: Stay;
};
