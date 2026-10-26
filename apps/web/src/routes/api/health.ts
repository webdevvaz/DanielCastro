import { createFileRoute } from "@tanstack/react-router";
import { Effect } from "effect";

import { runHealthProbe } from "@/server/health-probe";
import { plainTextResponse } from "@/server/plain-text-response";
import { runtime } from "@/server/runtime.server";

const LIVENESS_TIMEOUT = "5 seconds";

/**
 * A liveness check for container health probes: 200 when the server runtime is built, otherwise
 * 503, also while it is still building after the timeout. The runtime keeps a failed build (for example, a missing environment variable or a
 * database that was down at startup), so a failing check tells the platform to restart the
 * instance. It does not query the database; `/api/ready` does.
 */
export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const live = await runHealthProbe(runtime, Effect.void, LIVENESS_TIMEOUT);

        return live ? plainTextResponse("Ok", 200) : plainTextResponse("Unavailable", 503);
      },
    },
  },
});
