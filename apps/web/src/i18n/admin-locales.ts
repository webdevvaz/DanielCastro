/** The languages of the admin area. Portuguese comes first: Daniel and Joana work in it. */
export const ADMIN_LOCALES = ["pt", "en"] as const;

/** The admin language before anyone chooses one. */
export const DEFAULT_ADMIN_LOCALE = "pt";

/** The cookie that remembers the admin language. */
export const ADMIN_LOCALE_COOKIE = "admin_locale";

/** Whether a value names an admin language. */
export const isAdminLocale = (value: unknown): value is AdminLocale =>
  ADMIN_LOCALES.some((locale) => locale === value);

/** A language of the admin area. */
export type AdminLocale = (typeof ADMIN_LOCALES)[number];
