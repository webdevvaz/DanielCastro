import { pingDatabase } from "@daniel/db";
import { createFileRoute } from "@tanstack/react-router";

import { runHealthProbe } from "@/server/health-probe";
import { plainTextResponse } from "@/server/plain-text-response";
import { runtime } from "@/server/runtime.server";

const READY_TIMEOUT = "3 seconds";

/**
 * A readiness check for load balancers: 200 when the server runtime is built and PostgreSQL
 * answers, otherwise 503, so traffic moves away from an instance that cannot serve requests. The
 * timeout includes the runtime's startup.
 */
export const Route = createFileRoute("/api/ready")({
  server: {
    handlers: {
      GET: async () => {
        const ready = await runHealthProbe(runtime, pingDatabase(), READY_TIMEOUT);

        return ready ? plainTextResponse("Ready", 200) : plainTextResponse("Not ready", 503);
      },
    },
  },
});
