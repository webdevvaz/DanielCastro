import { noop } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { PagePending } from "@/components/page-skeleton";
import { newsFeedQueryOptions } from "@/integrations/tanstack-query/instagram-query-options";
import { NewsPage } from "@/news/news-page";

/** News: Daniel's latest Instagram posts. */
export const Route = createFileRoute("/_site/news")({
  context: () => ({ newsFeedQueryOptions }),
  loader: ({ context }) => {
    void context.queryClient.query(context.newsFeedQueryOptions).catch(noop);
  },
  head: () => ({ meta: [{ title: "News — Daniel Castro" }] }),
  pendingComponent: PagePending,
  component: NewsPage,
});
