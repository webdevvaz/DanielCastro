import { queryOptions } from "@tanstack/react-query";

import { getAdminLocale } from "@/server/admin-locale/admin-locale.functions";

/**
 * The admin language. It changes only when an admin switches it, which writes the new value into
 * this query and the cookie, so it never goes stale by itself.
 */
export const adminLocaleQueryOptions = queryOptions({
  queryKey: ["admin-locale"] as const,
  queryFn: () => getAdminLocale(),
  staleTime: Number.POSITIVE_INFINITY,
});
