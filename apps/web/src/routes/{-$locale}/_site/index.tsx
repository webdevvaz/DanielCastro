import { noop } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { PagePending } from "@/components/page-skeleton";
import { GalleryPage } from "@/gallery/gallery-page";
import {
  galleryQueryOptions,
  galleryTagsQueryOptions,
} from "@/integrations/tanstack-query/gallery-query-options";

/** The home page: Daniel's work, the full gallery. */
export const Route = createFileRoute("/{-$locale}/_site/")({
  context: () => ({ galleryQueryOptions, galleryTagsQueryOptions }),
  loader: ({ context }) => {
    void context.queryClient.query(context.galleryQueryOptions).catch(noop);
    void context.queryClient.query(context.galleryTagsQueryOptions).catch(noop);
  },
  pendingComponent: PagePending,
  component: GalleryPage,
});
