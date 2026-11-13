import { format, isSameMonth, isSameYear, parseISO } from "date-fns";

import { DATE_LOCALES, type Locale } from "@/i18n/locales";

/**
 * Two calendar dates (`yyyy-MM-dd`) for display in a language: "19 Nov 2026", "19 – 23 Nov 2026",
 * "28 Nov – 2 Dec 2026", or "29 Dec 2026 – 3 Jan 2027" in English, with month names in the given
 * language. No time zone applies to calendar dates.
 */
export function formatDateRange(startsOn: string, endsOn: string, locale: Locale) {
  const start = parseISO(startsOn);
  const end = parseISO(endsOn);
  const options = { locale: DATE_LOCALES[locale] };

  if (startsOn === endsOn) return format(start, "d MMM yyyy", options);

  if (isSameMonth(start, end)) {
    return `${format(start, "d", options)} – ${format(end, "d MMM yyyy", options)}`;
  }

  if (isSameYear(start, end)) {
    return `${format(start, "d MMM", options)} – ${format(end, "d MMM yyyy", options)}`;
  }

  return `${format(start, "d MMM yyyy", options)} – ${format(end, "d MMM yyyy", options)}`;
}
