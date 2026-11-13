import { Link } from "@tanstack/react-router";

import { localeParam } from "@/i18n/locales";
import { useSiteMessages } from "@/i18n/site-messages";
import { useLocale } from "@/i18n/use-locale";

import { LanguageSwitcher } from "./language-switcher";
import { SiteNav } from "./site-nav";

/**
 * The phone bar on every public page: the wordmark, the language switcher, booking, and a row of
 * page tabs.
 */
export function SiteMobileNav() {
  const locale = useLocale();
  const t = useSiteMessages();

  return (
    <div className="site-mobile">
      <div className="site-mobile-bar">
        <Link to="/{-$locale}" params={{ locale: localeParam(locale) }} aria-label={t.logoLabel}>
          <img src="/assets/brand/wordmark-white.webp" alt="" width={600} height={226} />
        </Link>
        <LanguageSwitcher className="language-switcher language-switcher-compact" />
        <Link
          className="btn btn-red btn-small"
          to="/{-$locale}/enquiry"
          params={{ locale: localeParam(locale) }}
        >
          {t.bookShort}
        </Link>
      </div>
      <SiteNav className="site-tabs" label={t.nav.tabsLabel} />
    </div>
  );
}
