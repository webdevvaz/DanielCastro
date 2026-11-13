import { createFileRoute } from "@tanstack/react-router";

import { getEnquiryPhotoResponse } from "@/server/enquiries/enquiry-photo-route.server";
import { runServerRoute } from "@/server/run.server";

/** Serves a client's enquiry photo to a signed-in admin. */
export const Route = createFileRoute("/api/enquiry-photos/$")({
  server: {
    handlers: {
      GET: ({ request }) => runServerRoute(request, getEnquiryPhotoResponse(request)),
    },
  },
});
