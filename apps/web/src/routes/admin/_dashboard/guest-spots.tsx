import { noop } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminGuestSpotsPage } from "@/admin/guest-spots/admin-guest-spots-page";
import { SectionSkeleton } from "@/components/page-skeleton";
import { adminGuestSpotsQueryOptions } from "@/integrations/tanstack-query/guest-spot-query-options";

/** Guest spot management. */
export const Route = createFileRoute("/admin/_dashboard/guest-spots")({
  context: () => ({ adminGuestSpotsQueryOptions }),
  loader: ({ context }) => {
    void context.queryClient.query(context.adminGuestSpotsQueryOptions).catch(noop);
  },
  pendingComponent: () => <SectionSkeleton blocks={2} />,
  component: AdminGuestSpotsPage,
});
