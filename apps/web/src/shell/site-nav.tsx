import { useQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";

import { appConfig } from "@/app-config";

import { SITE_PAGES } from "./navigation";

/**
 * Links to every public page, the current one marked, and the shop. The side menu and the phone
 * tabs both show them. News shows only while it is live (an Instagram account is connected). The
 * shop opens Necrotic Wear until the site has its own shop page.
 */
export function SiteNav({ className, label }: { className: string; label: string }) {
  const context = useRouteContext({ from: "/_site" });

  const { data: newsStatus } = useQuery(context.newsStatusQueryOptions);

  const newsLive = newsStatus?.live ?? false;
  const pages = SITE_PAGES.filter((page) => newsLive || !page.newsOnly);

  return (
    <nav className={className} aria-label={label}>
      {pages.map((page) => (
        <Link key={page.to} to={page.to} activeOptions={{ exact: page.exact }}>
          {page.label}
        </Link>
      ))}
      <a data-external="true" href={appConfig.links.shop} target="_blank" rel="noreferrer">
        Shop
      </a>
    </nav>
  );
}
