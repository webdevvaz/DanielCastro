import { noop } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { PagePending } from "@/components/page-skeleton";
import { pageTitleFor } from "@/i18n/site-messages";
import { newsFeedQueryOptions } from "@/integrations/tanstack-query/instagram-query-options";
import { NewsPage } from "@/news/news-page";

/** News: Daniel's latest Instagram posts. */
export const Route = createFileRoute("/{-$locale}/_site/news")({
  context: () => ({ newsFeedQueryOptions }),
  loader: ({ context }) => {
    void context.queryClient.query(context.newsFeedQueryOptions).catch(noop);
  },
  head: ({ params }) => ({ meta: [{ title: pageTitleFor(params.locale, "news") }] }),
  pendingComponent: PagePending,
  component: NewsPage,
});
