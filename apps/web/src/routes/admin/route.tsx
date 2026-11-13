import { createFileRoute } from "@tanstack/react-router";

import { adminLocaleQueryOptions } from "@/integrations/tanstack-query/admin-locale-query-options";

/**
 * The admin area, signed in or not: it reads the admin language (Portuguese or English) before
 * any admin page renders, so the server and the browser show the same language.
 */
export const Route = createFileRoute("/admin")({
  context: () => ({ adminLocaleQueryOptions }),
  beforeLoad: async ({ context }) => {
    const adminLocale = await context.queryClient.query({
      ...context.adminLocaleQueryOptions,
      staleTime: "static",
    });

    return { adminLocale };
  },
});
