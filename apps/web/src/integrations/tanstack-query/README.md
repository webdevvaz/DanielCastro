# integrations/tanstack-query

One file per domain: `<domain>-query-options.ts`, with a query-key object and `queryOptions` factories. Getter server functions are called inside `queryFn`.

`context.ts` holds the `QueryClient` defaults. Components never import query options; they read them, and `queryClient`, from the route context.
