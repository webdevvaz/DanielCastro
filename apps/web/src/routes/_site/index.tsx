import { noop } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { PagePending } from "@/components/page-skeleton";
import { GalleryPage } from "@/gallery/gallery-page";
import { galleryQueryOptions } from "@/integrations/tanstack-query/gallery-query-options";

/** The home page: Daniel's work, the full gallery. */
export const Route = createFileRoute("/_site/")({
  context: () => ({ galleryQueryOptions }),
  loader: ({ context }) => {
    void context.queryClient.query(context.galleryQueryOptions).catch(noop);
  },
  pendingComponent: PagePending,
  component: GalleryPage,
});
