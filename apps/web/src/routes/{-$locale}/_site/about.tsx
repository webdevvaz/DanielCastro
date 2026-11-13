import { noop } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AboutPage } from "@/about/about-page";
import { PagePending } from "@/components/page-skeleton";
import { pageTitleFor } from "@/i18n/site-messages";
import { studioPhotosQueryOptions } from "@/integrations/tanstack-query/gallery-query-options";

/** About Daniel, with the studio photos from the gallery's Studio section. */
export const Route = createFileRoute("/{-$locale}/_site/about")({
  context: () => ({ studioPhotosQueryOptions }),
  loader: ({ context }) => {
    void context.queryClient.query(context.studioPhotosQueryOptions).catch(noop);
  },
  head: ({ params }) => ({ meta: [{ title: pageTitleFor(params.locale, "about") }] }),
  pendingComponent: PagePending,
  component: AboutPage,
});
