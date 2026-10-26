import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";

/**
 * The studio's time zone. "Today" for guest spots and other calendar dates is today in Braga,
 * whatever the server's or the visitor's zone.
 */
export const STUDIO_TIME_ZONE = "Europe/Lisbon";

/** Today's calendar date in the studio's time zone, such as `2026-11-19`. */
export const studioToday = () => format(new TZDate(Date.now(), STUDIO_TIME_ZONE), "yyyy-MM-dd");
