import { noop } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminTravelPage } from "@/admin/travel/admin-travel-page";
import { SectionSkeleton } from "@/components/page-skeleton";
import { adminTravelSettingsQueryOptions } from "@/integrations/tanstack-query/travel-query-options";

/** Travel estimator settings. */
export const Route = createFileRoute("/admin/_dashboard/travel")({
  context: () => ({ adminTravelSettingsQueryOptions }),
  loader: ({ context }) => {
    void context.queryClient.query(context.adminTravelSettingsQueryOptions).catch(noop);
  },
  pendingComponent: () => <SectionSkeleton blocks={2} />,
  component: AdminTravelPage,
});
