import { formatDuration, minutesToHours } from "date-fns";

/** Whole euros, such as "€196". */
export const euros = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** "2 hours 25 minutes", or "50 minutes". */
export const formatMinutes = (minutes: number) =>
  formatDuration({ hours: minutesToHours(minutes), minutes: minutes % 60 });

/** "1 night", or "3 nights". */
export const formatNights = (nights: number) => (nights === 1 ? "1 night" : `${nights} nights`);
