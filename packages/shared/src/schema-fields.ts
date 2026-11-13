import { isMatch } from "date-fns";
import { Schema } from "effect";

/** How a calendar date travels between the browser, the server, and the database. */
const CALENDAR_DATE_FORMAT = "yyyy-MM-dd";

/** Text that must not be blank after trimming, up to `maxLength` characters. */
export const requiredText = (label: string, maxLength: number) =>
  Schema.Trim.check(
    Schema.isMinLength(1, { message: `${label} is required` }),
    Schema.isMaxLength(maxLength, { message: `${label} must be at most ${maxLength} characters` }),
  );

/** Text that may be empty, up to `maxLength` characters after trimming. */
export const optionalText = (label: string, maxLength: number) =>
  Schema.Trim.check(
    Schema.isMaxLength(maxLength, { message: `${label} must be at most ${maxLength} characters` }),
  );

/** A calendar date without a time, such as `2026-11-19`. */
export const CalendarDate = Schema.String.check(
  Schema.makeFilter(
    (value: string) =>
      (value.length === CALENDAR_DATE_FORMAT.length && isMatch(value, CALENDAR_DATE_FORMAT)) ||
      "Enter a date such as 2026-11-19",
  ),
);

/** An email address: something@domain.tld, trimmed, up to 254 characters. */
export const EmailAddress = Schema.Trim.check(
  Schema.isMaxLength(254, { message: "Enter a valid email address" }),
  Schema.isPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: "Enter a valid email address" }),
);
