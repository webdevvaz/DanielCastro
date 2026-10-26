import type { getAdminGuestSpots } from "@/server/guest-spots/guest-spots.functions";

/** A guest spot as the admin area lists it. */
export type AdminGuestSpot = Awaited<ReturnType<typeof getAdminGuestSpots>>[number];
