import { noop } from "@tanstack/react-query";
import { Outlet, createFileRoute } from "@tanstack/react-router";

import { upcomingGuestSpotsQueryOptions } from "@/integrations/tanstack-query/guest-spot-query-options";
import { newsStatusQueryOptions } from "@/integrations/tanstack-query/instagram-query-options";
import { shopCartQueryOptions } from "@/integrations/tanstack-query/shop-query-options";
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
 * The public site: every page with the side menu, or the phone bar and footer.
 *
 * The menu shows the next guest spot, and News only while it is live. Each is one database read,
 * and the loader waits for both, side by side, so the server renders the final menu and sends its
 * data with the page. Without the wait, News would appear after the page loads and move the other
 * links, and a guest spot that the server drew before the browser had its data would not match
 * the browser's first draw (a hydration error). When a read fails, the menu leaves that part out.
 */
export const Route = createFileRoute("/{-$locale}/_site")({
  // The cart is not loaded here: the menu shows its count once the browser has it.
  context: () => ({ upcomingGuestSpotsQueryOptions, newsStatusQueryOptions, shopCartQueryOptions }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.query(context.upcomingGuestSpotsQueryOptions).catch(noop),
      context.queryClient.query(context.newsStatusQueryOptions).catch(noop),
    ]);
  },
  component: SiteLayout,
});
