import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { RootErrorComponent } from "./defaults/error";
import { NotFoundComponent } from "./defaults/not-found";
import { getContext } from "./integrations/tanstack-query/context";
import { routeTree } from "./routeTree.gen";

/**
 * The router and query client use the same request-scoped context so route
 * data can dehydrate during SSR and hydrate into the matching cache.
 */
export function getRouter() {
  const context = getContext();

  const router = createTanStackRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: RootErrorComponent,
    defaultNotFoundComponent: NotFoundComponent,
  });

  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
