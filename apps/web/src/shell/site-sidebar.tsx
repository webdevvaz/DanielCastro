import { useQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";

import { appConfig } from "@/app-config";
import { formatDateRange } from "@/components/format-date-range";

import { SiteContact } from "./site-contact";
import { SiteNav } from "./site-nav";

/** The next guest spot, when one is announced. It loads after the page, so it never blocks it. */
function NextGuestSpot() {
  const context = useRouteContext({ from: "/_site" });

  const { data: spots } = useQuery(context.upcomingGuestSpotsQueryOptions);

  const next = spots?.at(0);

  if (next === undefined) return null;

  return (
    <Link className="site-next-spot" to="/guest-spots">
      Next guest spot
      <br />
      <b>{next.city}</b>, {formatDateRange(next.startsOn, next.endsOn)}
    </Link>
  );
}

/** The desktop side menu on every public page: the pages, booking, and the studio's contact. */
export function SiteSidebar() {
  return (
    <aside className="site-sidebar">
      <Link className="site-sidebar-logo" to="/" aria-label={`${appConfig.name}, work`}>
        <img src="/assets/brand/badge-white.webp" alt="" width={900} height={736} />
      </Link>
      <p className="site-tagline">
        A fan first. <em>An artist through and through.</em>
      </p>
      <SiteNav className="site-nav" label="Main" />
      <NextGuestSpot />
      <a className="btn btn-red" href={appConfig.links.enquiry} target="_blank" rel="noreferrer">
        Book a session
      </a>
      <SiteContact />
    </aside>
  );
}
