import { noop } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminFiltersPage } from "@/admin/filters/admin-filters-page";
import { SectionSkeleton } from "@/components/page-skeleton";
import { galleryTagsQueryOptions } from "@/integrations/tanstack-query/gallery-query-options";

/** The themes and series that visitors filter the work by. */
export const Route = createFileRoute("/admin/_dashboard/filters")({
  context: () => ({ galleryTagsQueryOptions }),
  loader: ({ context }) => {
    void context.queryClient.query(context.galleryTagsQueryOptions).catch(noop);
  },
  pendingComponent: () => <SectionSkeleton blocks={2} />,
  component: AdminFiltersPage,
});
