import { queryOptions } from "@tanstack/react-query";

import {
  getAdminGuestSpots,
  getUpcomingGuestSpots,
} from "@/server/guest-spots/guest-spots.functions";

/** Query keys for guest spots. Invalidate `all` after any change. */
export const guestSpotQueryKeys = {
  all: ["guest-spots"] as const,
  upcoming: ["guest-spots", "upcoming"] as const,
  admin: ["guest-spots", "admin"] as const,
};

/** Guest spots that have not ended yet. */
export const upcomingGuestSpotsQueryOptions = queryOptions({
  queryKey: guestSpotQueryKeys.upcoming,
  queryFn: () => getUpcomingGuestSpots(),
});

/** Every guest spot, for the admin area. */
export const adminGuestSpotsQueryOptions = queryOptions({
  queryKey: guestSpotQueryKeys.admin,
  queryFn: () => getAdminGuestSpots(),
});
