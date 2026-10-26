import type { QueryClient } from "@tanstack/react-query";

/** Removes all cached user and organization data before an authentication identity changes. */
export function clearQueryCacheForAuthTransition(queryClient: QueryClient) {
  queryClient.removeQueries();
}
