import { queryOptions } from "@tanstack/react-query";

import { getAdminInstagram, getNewsFeed } from "@/server/instagram/instagram.functions";

/** Instagram's image addresses expire, so the posts are read again after this time. */
const NEWS_STALE_TIME = 5 * 60_000;

/** Query keys for Instagram data. Invalidate `all` after connecting or disconnecting. */
export const instagramQueryKeys = {
  all: ["instagram"] as const,
  news: ["instagram", "news"] as const,
  admin: ["instagram", "admin"] as const,
};

/** Daniel's latest Instagram posts for the News page. */
export const newsFeedQueryOptions = queryOptions({
  queryKey: instagramQueryKeys.news,
  queryFn: () => getNewsFeed(),
  staleTime: NEWS_STALE_TIME,
});

/** The connected account and its recent posts, for the Instagram admin page. */
export const adminInstagramQueryOptions = queryOptions({
  queryKey: instagramQueryKeys.admin,
  queryFn: () => getAdminInstagram(),
});
