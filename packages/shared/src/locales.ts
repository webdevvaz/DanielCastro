import { Schema } from "effect";

/** The languages with an address prefix, such as `/pt/about`. */
export const PREFIXED_LOCALES = ["pt", "fr", "de", "es"] as const;

/** The language of a page without a prefix. */
export const DEFAULT_LOCALE = "en";

/** The languages of the public site, the default first. */
export const LOCALES = [DEFAULT_LOCALE, ...PREFIXED_LOCALES] as const;

/** A language of the public site, as server-function input. */
export const SiteLocale = Schema.Literals(LOCALES);

/** A language of the public site. */
export type Locale = (typeof LOCALES)[number];
