import { useRouteContext } from "@tanstack/react-router";

import { LocaleFlag } from "@/components/locale-flag";
import { ADMIN_LOCALE_COOKIE, ADMIN_LOCALES, type AdminLocale } from "@/i18n/admin-locales";
import { LOCALE_NAMES } from "@/i18n/locales";

import { useAdminText } from "./use-admin-text";

/** A year: the admin area keeps the language until someone switches it again. */
const COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

/** Remembers the admin language for the next visit. */
const rememberAdminLocale = (locale: AdminLocale) => {
  document.cookie = `${ADMIN_LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
};

/**
 * Switches the admin area between Portuguese and English. The cookie keeps the choice for the next
 * visit; the query update changes the text on screen at once.
 */
export function AdminLanguageSwitch() {
  const { queryClient, adminLocaleQueryOptions } = useRouteContext({ from: "/admin" });

  const { locale, t } = useAdminText();

  const choose = (next: AdminLocale) => {
    rememberAdminLocale(next);

    queryClient.setQueryData(adminLocaleQueryOptions.queryKey, next);
  };

  return (
    <div className="language-switcher" role="group" aria-label={t.language}>
      {ADMIN_LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          title={LOCALE_NAMES[option]}
          aria-label={LOCALE_NAMES[option]}
          aria-pressed={option === locale}
          onClick={() => choose(option)}
        >
          <LocaleFlag locale={option} />
        </button>
      ))}
    </div>
  );
}
