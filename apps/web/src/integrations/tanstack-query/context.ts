import { QueryCache, QueryClient } from "@tanstack/react-query";

/** Creates the query client shared by the router and the React tree. */
export function getContext() {
  const queryClient = new QueryClient({
    queryCache: new QueryCache(),
    defaultOptions: {
      queries: {
        staleTime: 60_000, // 1 minute
        gcTime: 30 * 60_000,
        retry: 1,
        refetchOnMount: true,
        refetchOnReconnect: true,
        refetchOnWindowFocus: false,
        throwOnError: true,
      },
      mutations: {
        retry: 0,
      },
    },
  });

  return { queryClient };
}
