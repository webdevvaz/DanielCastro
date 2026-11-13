import { createFileRoute } from "@tanstack/react-router";

import { ADMIN_TEXT } from "@/admin/admin-text";
import { ConnectLinkPage } from "@/admin/instagram/connect-link-page";
import { SectionSkeleton } from "@/components/page-skeleton";
import { instagramConnectLinkQueryOptions } from "@/integrations/tanstack-query/instagram-query-options";

const RESULTS = ["connected", "cancelled", "wrong_account", "failed"] as const;

/**
 * The page a connect link opens: Daniel connects his Instagram account from his phone without an
 * admin account. The link itself is the permission; the server checks it again at each step.
 */
export const Route = createFileRoute("/admin/connect-instagram/$token")({
  // `result` comes back from the callback route; any other value is ignored.
  validateSearch: (search: Record<string, unknown>): ConnectLinkSearch => ({
    result: RESULTS.find((result) => result === search["result"]),
  }),
  context: () => ({ instagramConnectLinkQueryOptions }),
  loader: async ({ context, params }) => {
    await context.queryClient.query(context.instagramConnectLinkQueryOptions(params.token));
  },
  head: ({ match }) => ({
    meta: [
      { title: ADMIN_TEXT[match.context.adminLocale].connectLink.pageTitle },
      { name: "robots", content: "noindex" },
    ],
  }),
  pendingComponent: () => <SectionSkeleton blocks={1} />,
  component: ConnectLinkPage,
});

type ConnectLinkSearch = {
  readonly result?: (typeof RESULTS)[number] | undefined;
};
