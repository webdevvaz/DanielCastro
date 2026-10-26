import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/** The browser Better Auth client. The browser may only sign in, sign out, and read the session. */
export const authClient = createAuthClient({
  plugins: [adminClient()],
});
