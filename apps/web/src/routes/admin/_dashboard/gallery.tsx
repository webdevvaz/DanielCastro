import { noop } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminGalleryPage } from "@/admin/gallery/admin-gallery-page";
import { SectionSkeleton } from "@/components/page-skeleton";
import { adminGalleryQueryOptions } from "@/integrations/tanstack-query/gallery-query-options";

/** Gallery management. */
export const Route = createFileRoute("/admin/_dashboard/gallery")({
  context: () => ({ adminGalleryQueryOptions }),
  loader: ({ context }) => {
    void context.queryClient.query(context.adminGalleryQueryOptions).catch(noop);
  },
  pendingComponent: () => <SectionSkeleton blocks={6} />,
  component: AdminGalleryPage,
});
