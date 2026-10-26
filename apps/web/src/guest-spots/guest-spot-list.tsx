import type { getUpcomingGuestSpots } from "@/server/guest-spots/guest-spots.functions";

import { appConfig } from "@/app-config";
import { formatDateRange } from "@/components/format-date-range";

const STATUS_LABELS = { open: "Books open", full: "Fully booked" } as const;

/** Upcoming guest spots, the soonest first, or a note to follow Instagram when there are none. */
export function GuestSpotList({ spots }: { spots: UpcomingGuestSpots }) {
  if (spots.length === 0) {
    return (
      <p className="empty-state">
        No guest spots are announced right now. New dates appear here and on{" "}
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
          <span className="spot-dates">{formatDateRange(spot.startsOn, spot.endsOn)}</span>
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
            {STATUS_LABELS[spot.status]}
          </span>
        </li>
      ))}
    </ul>
  );
}

type UpcomingGuestSpots = Awaited<ReturnType<typeof getUpcomingGuestSpots>>;
