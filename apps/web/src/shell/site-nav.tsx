import { useQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";

import { localeParam } from "@/i18n/locales";
import { useSiteMessages } from "@/i18n/site-messages";
import { useLocale } from "@/i18n/use-locale";

import { SITE_PAGES } from "./navigation";

/**
 * Links to every public page in the page's language, the current one marked. The side menu and
 * the phone tabs both show them. News shows only while it is live (an Instagram account is
 * connected). Shop shows how many items the cart holds, once the browser has the cart.
 */
export function SiteNav({ className, label }: { className: string; label: string }) {
  const context = useRouteContext({ from: "/{-$locale}/_site" });
  const locale = useLocale();
  const t = useSiteMessages();

  const { data: newsStatus } = useQuery(context.newsStatusQueryOptions);
  const { data: cartView } = useQuery(context.shopCartQueryOptions(locale));

  const newsLive = newsStatus?.live ?? false;
  const pages = SITE_PAGES.filter((page) => newsLive || !page.newsOnly);
  const cartCount = cartView?.cart?.totalQuantity ?? 0;

  return (
    <nav className={className} aria-label={label}>
      {pages.map((page) => (
        <Link
          key={page.to}
          to={page.to}
          params={{ locale: localeParam(locale) }}
          activeOptions={{ exact: page.exact }}
        >
          <span>
            {t.nav[page.label]}
            {page.label === "shop" && cartCount > 0 ? (
              <span className="nav-count">
                <span aria-hidden="true">{cartCount}</span>
                <span className="visually-hidden">{t.cartCount(cartCount)}</span>
              </span>
            ) : null}
          </span>
        </Link>
      ))}
    </nav>
  );
}
