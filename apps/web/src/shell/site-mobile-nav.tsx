import { Link } from "@tanstack/react-router";

import { appConfig } from "@/app-config";

import { SiteNav } from "./site-nav";

/** The phone bar on every public page: the wordmark, booking, and a row of page tabs. */
export function SiteMobileNav() {
  return (
    <div className="site-mobile">
      <div className="site-mobile-bar">
        <Link to="/" aria-label={`${appConfig.name}, work`}>
          <img src="/assets/brand/wordmark-white.webp" alt="" width={600} height={226} />
        </Link>
        <a
          className="btn btn-red btn-small"
          href={appConfig.links.enquiry}
          target="_blank"
          rel="noreferrer"
        >
          Book
        </a>
      </div>
      <SiteNav className="site-tabs" label="Pages" />
    </div>
  );
}
