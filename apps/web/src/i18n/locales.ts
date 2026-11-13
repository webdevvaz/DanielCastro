import type { Locale as DateFnsLocale } from "date-fns";

import { de, enGB, es, fr, pt } from "date-fns/locale";

/** The languages with an address prefix, such as `/pt/about`. */
export const PREFIXED_LOCALES = ["pt", "fr", "de", "es"] as const;

/** The language of a page without a prefix. */
export const DEFAULT_LOCALE = "en";

/** The languages of the public site, the default first. */
export const LOCALES = [DEFAULT_LOCALE, ...PREFIXED_LOCALES] as const;

/** The cookie that remembers the language a visitor chose in the switcher. */
export const LOCALE_COOKIE = "locale";

/** Each language in its own words, for the switcher. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  pt: "Português",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
};

/** Date names (months, weekdays) for date-fns, per language. */
export const DATE_LOCALES: Record<Locale, DateFnsLocale> = { en: enGB, pt, fr, de, es };

/** Number and currency formats for `Intl.NumberFormat`, per language. */
export const NUMBER_LOCALES: Record<Locale, string> = {
  en: "en-IE",
  pt: "pt-PT",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
};

/** Whether a value names one of the site's languages. */
export const isLocale = (value: unknown): value is Locale =>
  LOCALES.some((locale) => locale === value);

/** The language that a `{-$locale}` address segment names: English when there is none. */
export const localeFromParam = (param: string | undefined): Locale =>
  isLocale(param) ? param : DEFAULT_LOCALE;

/** The `{-$locale}` address segment of a language: none for English, the code for the others. */
export const localeParam = (locale: Locale) => (locale === DEFAULT_LOCALE ? undefined : locale);

/** A language of the public site. */
export type Locale = (typeof LOCALES)[number];
