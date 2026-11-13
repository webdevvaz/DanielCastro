import { formatDuration, minutesToHours } from "date-fns";

import { DATE_LOCALES, NUMBER_LOCALES, type Locale } from "@/i18n/locales";

/** Whole euros in a language: "€196" in English, "196 €" in Portuguese, French, and German. */
export const eurosIn = (locale: Locale) =>
  new Intl.NumberFormat(NUMBER_LOCALES[locale], {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

/** A range of whole euros, such as "€60–€110", kept on one line. */
export const euroRange = (locale: Locale, low: number, high: number) => {
  const euros = eurosIn(locale);

  // A no-break joiner on each side of the dash keeps the range from breaking across lines.
  return `${euros.format(low)}⁠–⁠${euros.format(high)}`;
};

/** A duration in a language, such as "2 hours 25 minutes" or "50 minutes". */
export const formatMinutes = (minutes: number, locale: Locale) =>
  formatDuration(
    { hours: minutesToHours(minutes), minutes: minutes % 60 },
    { locale: DATE_LOCALES[locale] },
  );
