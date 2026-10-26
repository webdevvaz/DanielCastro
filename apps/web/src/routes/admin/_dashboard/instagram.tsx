import { noop } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminInstagramPage } from "@/admin/instagram/admin-instagram-page";
import { SectionSkeleton } from "@/components/page-skeleton";
import { galleryQueryKeys } from "@/integrations/tanstack-query/gallery-query-options";
import {
  adminInstagramQueryOptions,
  instagramQueryKeys,
} from "@/integrations/tanstack-query/instagram-query-options";

/** Instagram: connect Daniel's account and add posts to the gallery. */
export const Route = createFileRoute("/admin/_dashboard/instagram")({
  // `connect=failed` comes back from the connect routes; any other value is ignored.
  validateSearch: (search: Record<string, unknown>): InstagramAdminSearch => ({
    connect: search["connect"] === "failed" ? "failed" : undefined,
  }),
  context: () => ({ adminInstagramQueryOptions, instagramQueryKeys, galleryQueryKeys }),
  loader: ({ context }) => {
    void context.queryClient.query(context.adminInstagramQueryOptions).catch(noop);
  },
  pendingComponent: () => <SectionSkeleton blocks={4} />,
  component: AdminInstagramPage,
});

type InstagramAdminSearch = {
  readonly connect?: "failed" | undefined;
};
