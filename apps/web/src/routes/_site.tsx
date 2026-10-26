import { noop } from "@tanstack/react-query";
import { Outlet, createFileRoute } from "@tanstack/react-router";

import { upcomingGuestSpotsQueryOptions } from "@/integrations/tanstack-query/guest-spot-query-options";
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
 */
export const Route = createFileRoute("/_site")({
  context: () => ({ upcomingGuestSpotsQueryOptions }),
  loader: ({ context }) => {
    void context.queryClient.query(context.upcomingGuestSpotsQueryOptions).catch(noop);
  },
  component: SiteLayout,
});
