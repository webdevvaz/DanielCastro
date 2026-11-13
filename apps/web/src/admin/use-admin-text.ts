import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

import { ADMIN_TEXT } from "./admin-text";

/** The admin language and the admin text in it. A switch of language updates both at once. */
export function useAdminText() {
  const { adminLocaleQueryOptions } = useRouteContext({ from: "/admin" });

  const { data: locale } = useSuspenseQuery(adminLocaleQueryOptions);

  return { locale, t: ADMIN_TEXT[locale] };
}
