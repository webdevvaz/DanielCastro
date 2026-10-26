import { format, isSameMonth, isSameYear, parseISO } from "date-fns";

/**
 * Two calendar dates (`yyyy-MM-dd`) for display: "19 Nov 2026", "19 – 23 Nov 2026",
 * "28 Nov – 2 Dec 2026", or "29 Dec 2026 – 3 Jan 2027". No time zone applies to calendar dates.
 */
export function formatDateRange(startsOn: string, endsOn: string) {
  const start = parseISO(startsOn);
  const end = parseISO(endsOn);

  if (startsOn === endsOn) return format(start, "d MMM yyyy");

  if (isSameMonth(start, end)) return `${format(start, "d")} – ${format(end, "d MMM yyyy")}`;

  if (isSameYear(start, end)) return `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`;

  return `${format(start, "d MMM yyyy")} – ${format(end, "d MMM yyyy")}`;
}
