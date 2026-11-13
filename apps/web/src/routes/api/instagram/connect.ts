import { createFileRoute } from "@tanstack/react-router";

import { startInstagramConnection } from "@/server/instagram/instagram-route.server";
import { runServerRoute } from "@/server/run.server";

/**
 * Sends a signed-in admin, or anyone with a valid connect link (`?link=`), to Instagram Login to
 * connect Daniel's account.
 */
export const Route = createFileRoute("/api/instagram/connect")({
  server: {
    handlers: {
      GET: ({ request }) => runServerRoute(request, startInstagramConnection(request)),
    },
  },
});
