import { noop } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminOverview } from "@/admin/admin-overview";
import { SectionSkeleton } from "@/components/page-skeleton";
import { adminGalleryQueryOptions } from "@/integrations/tanstack-query/gallery-query-options";
import { adminGuestSpotsQueryOptions } from "@/integrations/tanstack-query/guest-spot-query-options";
import { adminTravelSettingsQueryOptions } from "@/integrations/tanstack-query/travel-query-options";

/** The admin overview. */
export const Route = createFileRoute("/admin/_dashboard/")({
  context: () => ({
    adminGalleryQueryOptions,
    adminGuestSpotsQueryOptions,
    adminTravelSettingsQueryOptions,
  }),
  loader: ({ context }) => {
    void context.queryClient.query(context.adminGalleryQueryOptions).catch(noop);
    void context.queryClient.query(context.adminGuestSpotsQueryOptions).catch(noop);
    void context.queryClient.query(context.adminTravelSettingsQueryOptions).catch(noop);
  },
  pendingComponent: () => <SectionSkeleton />,
  component: AdminOverview,
});
