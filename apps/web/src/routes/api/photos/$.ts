import { createFileRoute } from "@tanstack/react-router";

import { getPhotoResponse } from "@/server/gallery/photo-route.server";
import { runtime } from "@/server/runtime.server";

/** Serves stored gallery photos. */
export const Route = createFileRoute("/api/photos/$")({
  server: {
    handlers: {
      GET: ({ request }) => runtime.runPromise(getPhotoResponse(request)),
    },
  },
});
