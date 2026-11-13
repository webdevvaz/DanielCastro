import { useLocation } from "@tanstack/react-router";

import { localizedPath, pathWithoutLocale } from "@/i18n/locale-path";
import { LOCALE_COOKIE, LOCALE_NAMES, LOCALES, type Locale } from "@/i18n/locales";
import { useSiteMessages } from "@/i18n/site-messages";
import { useLocale } from "@/i18n/use-locale";

/** A year: the site remembers the choice until the visitor changes it. */
const COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

/** Remembers the chosen language, so the site opens in it on the next visit. */
const rememberLocale = (locale: Locale) => {
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
};

/**
 * The same page in each language. A plain link loads the page again in the new language, with
 * the same search, such as a travel estimate.
 */
export function LanguageSwitcher({ className }: { className: string }) {
  const locale = useLocale();
  const location = useLocation();
  const t = useSiteMessages();

  const path = pathWithoutLocale(location.pathname);

  return (
    <nav className={className} aria-label={t.language}>
      {LOCALES.map((option) => (
        <a
          key={option}
          href={`${localizedPath(option, path)}${location.searchStr}`}
          hrefLang={option}
          lang={option}
          title={LOCALE_NAMES[option]}
          aria-current={option === locale ? "true" : undefined}
          onClick={() => rememberLocale(option)}
        >
          {option.toUpperCase()}
        </a>
      ))}
    </nav>
  );
}
