import { queryOptions } from "@tanstack/react-query";

import { getSession } from "@/server/auth/auth.functions";

/**
 * How often an open admin page reads the session again, so it finds a session that ended
 * (expiry, sign-out in another tab) without a navigation.
 */
const SESSION_REFRESH_INTERVAL_MS = 60_000;

/** Query keys for authentication data. */
export const authQueryKeys = {
  session: ["auth", "session"] as const,
};

/**
 * The current session, or `null` when signed out. The admin layout watches it: it refreshes
 * every minute and when the window gets focus. A refresh that fails (for example, the network is
 * down) keeps the last session instead of showing the error page; only `null` ends the session.
 */
export const getSessionQueryOptions = queryOptions({
  queryKey: authQueryKeys.session,
  queryFn: () => getSession(),
  staleTime: 30_000,
  refetchInterval: SESSION_REFRESH_INTERVAL_MS,
  refetchOnWindowFocus: true,
  throwOnError: false,
});
