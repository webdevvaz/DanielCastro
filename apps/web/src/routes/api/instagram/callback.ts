import { createFileRoute } from "@tanstack/react-router";

import { finishInstagramConnection } from "@/server/instagram/instagram-route.server";
import { runServerRoute } from "@/server/run.server";

/** Instagram Login sends the admin back here; this must be a redirect URI in the Meta app. */
export const Route = createFileRoute("/api/instagram/callback")({
  server: {
    handlers: {
      GET: ({ request }) => runServerRoute(request, finishInstagramConnection(request)),
    },
  },
});
