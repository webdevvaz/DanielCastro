import { noop } from "@tanstack/react-query";
import { Outlet, createFileRoute } from "@tanstack/react-router";

import { upcomingGuestSpotsQueryOptions } from "@/integrations/tanstack-query/guest-spot-query-options";
import { newsStatusQueryOptions } from "@/integrations/tanstack-query/instagram-query-options";
import { SiteFooter } from "@/shell/site-footer";
import { SiteMobileNav } from "@/shell/site-mobile-nav";
import { SiteSidebar } from "@/shell/site-sidebar";

function SiteLayout() {
  return (
    <div className="site">
      <SiteSidebar />
      <div className="site-main">
        <SiteMobileNav />
        <Outlet />
        <SiteFooter />
      </div>
    </div>
  );
}

/**
 * The public site: every page with the side menu, or the phone bar and footer. The side menu
 * shows the next guest spot, so every page starts loading the guest spots.
 *
 * The menu shows News only while it is live. That check is one database read, and the loader
 * waits for it so the server renders the final menu: without it, News would appear after the page
 * loads and move the other links. When the check fails, the menu leaves News out.
 */
export const Route = createFileRoute("/_site")({
  context: () => ({ upcomingGuestSpotsQueryOptions, newsStatusQueryOptions }),
  loader: async ({ context }) => {
    void context.queryClient.query(context.upcomingGuestSpotsQueryOptions).catch(noop);

    await context.queryClient.query(context.newsStatusQueryOptions).catch(noop);
  },
  component: SiteLayout,
});
