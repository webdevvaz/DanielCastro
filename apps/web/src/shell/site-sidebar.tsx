import { useQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";

import { formatDateRange } from "@/components/format-date-range";
import { localeParam } from "@/i18n/locales";
import { useSiteMessages } from "@/i18n/site-messages";
import { useLocale } from "@/i18n/use-locale";

import { LanguageSwitcher } from "./language-switcher";
import { SiteContact } from "./site-contact";
import { SiteNav } from "./site-nav";

/** The next guest spot, when one is announced. It loads after the page, so it never blocks it. */
function NextGuestSpot() {
  const context = useRouteContext({ from: "/{-$locale}/_site" });
  const locale = useLocale();
  const t = useSiteMessages();

  const { data: spots } = useQuery(context.upcomingGuestSpotsQueryOptions);

  const next = spots?.at(0);

  if (next === undefined) return null;

  return (
    <Link
      className="site-next-spot"
      to="/{-$locale}/guest-spots"
      params={{ locale: localeParam(locale) }}
    >
      {t.nextGuestSpot}
      <br />
      <b>{next.city}</b>, {formatDateRange(next.startsOn, next.endsOn, locale)}
    </Link>
  );
}

/**
 * The desktop side menu on every public page: the pages, booking, the studio's contact, and the
 * language switcher.
 */
export function SiteSidebar() {
  const locale = useLocale();
  const t = useSiteMessages();

  return (
    <aside className="site-sidebar">
      <Link
        className="site-sidebar-logo"
        to="/{-$locale}"
        params={{ locale: localeParam(locale) }}
        aria-label={t.logoLabel}
      >
        <img src="/assets/brand/badge-white.webp" alt="" width={900} height={736} />
      </Link>
      <p className="site-tagline">
        {t.tagline.first} <em>{t.tagline.second}</em>
      </p>
      <SiteNav className="site-nav" label={t.nav.mainLabel} />
      <NextGuestSpot />
      <Link
        className="btn btn-red"
        to="/{-$locale}/enquiry"
        params={{ locale: localeParam(locale) }}
      >
        {t.bookSession}
      </Link>
      <SiteContact />
      <LanguageSwitcher className="language-switcher" />
    </aside>
  );
}
