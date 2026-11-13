import type { getUpcomingGuestSpots } from "@/server/guest-spots/guest-spots.functions";

import { appConfig } from "@/app-config";
import { formatDateRange } from "@/components/format-date-range";
import { useLocale } from "@/i18n/use-locale";

import { GUEST_SPOTS_PAGE_TEXT } from "./guest-spots-page-text";

/** Upcoming guest spots, the soonest first, or a note to follow Instagram when there are none. */
export function GuestSpotList({ spots }: { spots: UpcomingGuestSpots }) {
  const locale = useLocale();
  const t = GUEST_SPOTS_PAGE_TEXT[locale];

  if (spots.length === 0) {
    return (
      <p className="empty-state">
        {t.emptyBefore}{" "}
        <a href={appConfig.links.instagram} target="_blank" rel="noreferrer">
          Instagram
        </a>
        .
      </p>
    );
  }

  return (
    <ul className="spots">
      {spots.map((spot) => (
        <li className="spot" key={spot.id}>
          <span className="spot-dates">{formatDateRange(spot.startsOn, spot.endsOn, locale)}</span>
          <div className="spot-place">
            <h3>
              {spot.city}, {spot.country}
            </h3>
            <p>
              {spot.studioName}
              {spot.address ? ` · ${spot.address}` : null}
            </p>
            {spot.note ? <p>{spot.note}</p> : null}
          </div>
          <span className="status-pill" data-status={spot.status}>
            {t.status[spot.status]}
          </span>
        </li>
      ))}
    </ul>
  );
}

type UpcomingGuestSpots = Awaited<ReturnType<typeof getUpcomingGuestSpots>>;
