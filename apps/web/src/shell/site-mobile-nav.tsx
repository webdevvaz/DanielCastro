import { Link } from "@tanstack/react-router";

import { appConfig } from "@/app-config";
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
        <a
          className="btn btn-red btn-small"
          href={appConfig.links.enquiry}
          target="_blank"
          rel="noreferrer"
        >
          {t.bookShort}
        </a>
      </div>
      <SiteNav className="site-tabs" label={t.nav.tabsLabel} />
    </div>
  );
}
