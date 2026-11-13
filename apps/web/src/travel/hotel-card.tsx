import type { getTripEstimate } from "@/server/travel/travel.functions";

import { formatDateRange } from "@/components/format-date-range";
import { RichText } from "@/i18n/rich-text";
import { useLocale } from "@/i18n/use-locale";

import { bookingHotelUrl, bookingUrl } from "./travel-links";
import { TRAVEL_TEXT } from "./travel-text";
import { euroRange, eurosIn } from "./trip-format";

function HotelOption({ hotel, stay }: HotelOptionProps) {
  const locale = useLocale();
  const t = TRAVEL_TEXT[locale].hotels;

  const details = [t.perNight(eurosIn(locale).format(hotel.pricePerNightEuros))];

  if (hotel.stars !== null) details.push(t.stars(hotel.stars));

  if (hotel.rating !== null) details.push(t.rated(hotel.rating.toFixed(1)));

  return (
    <li className="trip-option">
      <div>
        <b>{hotel.name}</b>
        <span>{details.join(" · ")}</span>
      </div>
      <a href={bookingHotelUrl(hotel.name, stay, locale)} target="_blank" rel="noreferrer">
        Booking.com
      </a>
    </li>
  );
}

/** The nights the hotel prices are for: the visitor's dates, or the example trip. */
function StayDatesLine({ tripDates }: { tripDates: TripDates }) {
  const locale = useLocale();
  const t = TRAVEL_TEXT[locale].hotels;

  const range = formatDateRange(tripDates.outbound, tripDates.return, locale);

  return (
    <p className="field-hint">{tripDates.example ? t.exampleStay(range) : t.forDates(range)}</p>
  );
}

/** The live hotels and their average, for the nights of the stay. */
function LiveHotels({ hotels, average, nights, stay }: LiveHotelsProps) {
  const locale = useLocale();
  const text = TRAVEL_TEXT[locale];
  const euros = eurosIn(locale);

  return (
    <>
      <p className="field-hint">{text.hotels.cheapest}</p>
      <ul className="trip-options">
        {hotels.map((hotel) => (
          <HotelOption key={hotel.name} hotel={hotel} stay={stay} />
        ))}
      </ul>
      <p>
        <RichText
          template={text.hotels.average}
          values={{
            average: <b>{euros.format(average)}</b>,
            total: <span className="trip-range">{euros.format(average * nights)}</span>,
            nights: text.nights(nights),
          }}
        />
      </p>
    </>
  );
}

/**
 * Hotels in Braga: the cheapest good hotels with live prices and their average, or the admin's
 * typical prices when live prices are not available.
 */
export function HotelCard({
  status,
  hotels,
  average,
  nights,
  settings,
  tripDates,
  stay,
}: HotelCardProps) {
  const locale = useLocale();
  const t = TRAVEL_TEXT[locale].hotels;

  // There is an average exactly when live hotels were found.
  const live = average === null ? null : { hotels, average };
  const typical = live === null && status !== "loading" ? settings : null;

  return (
    <article className="trip-card">
      <h3>{t.title}</h3>
      {tripDates === null ? null : <StayDatesLine tripDates={tripDates} />}
      {live === null ? (
        <p>{t[status === "found" ? "none" : status]}</p>
      ) : (
        <LiveHotels hotels={live.hotels} average={live.average} nights={nights} stay={stay} />
      )}
      {typical === null ? null : (
        <p>
          <RichText
            template={t.typical}
            values={{
              from: <b>{eurosIn(locale).format(typical.hotelFromEuros)}</b>,
              range: (
                <span className="trip-range">
                  {euroRange(locale, typical.hotelTypicalMinEuros, typical.hotelTypicalMaxEuros)}
                </span>
              ),
            }}
          />
        </p>
      )}
      <a
        className="btn btn-ghost btn-small"
        href={bookingUrl(stay, locale)}
        target="_blank"
        rel="noreferrer"
      >
        {t.search}
      </a>
    </article>
  );
}

type Estimate = Awaited<ReturnType<typeof getTripEstimate>>;

type Hotel = Estimate["hotels"][number];

type TripDates = Estimate["tripDates"];

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
  /** The dates the live prices are for; null while the estimate loads. */
  readonly tripDates: TripDates | null;
  /** The dates the prices are for, so Booking.com opens on the same nights. */
  readonly stay: Stay;
};
