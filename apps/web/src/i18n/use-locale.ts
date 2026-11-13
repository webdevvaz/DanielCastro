import { useParams } from "@tanstack/react-router";

import { DEFAULT_LOCALE, isLocale } from "./locales";

/**
 * The language of the current public page, from its address: `/pt/about` is Portuguese, `/about`
 * English. Outside the public site, such as on an error page for an unknown address, English.
 */
export function useLocale() {
  const params = useParams({ strict: false });

  return isLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
}
