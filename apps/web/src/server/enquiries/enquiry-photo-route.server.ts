import "@tanstack/react-start/server-only";
import { Effect } from "effect";

import { enquiryPhotoFileNameFromPath } from "@/enquiries/enquiry-files";

import { getRequestSession } from "../auth/session.server";
import { PhotoStorage } from "../gallery/photo-storage.server";

const emptyResponse = (status: number) =>
  new Response(null, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Serves a stored enquiry photo to a signed-in admin. Clients' photos are private: anyone else
 * gets 404, the same answer as for a photo that does not exist, so the response tells nothing.
 * Browsers may keep a photo for an hour, in their own cache only.
 */
export const getEnquiryPhotoResponse = Effect.fn("getEnquiryPhotoResponse")(
  function* (request: Request) {
    const session = yield* getRequestSession;

    if (session?.user.role !== "admin") return emptyResponse(404);

    const name = enquiryPhotoFileNameFromPath(new URL(request.url).pathname);

    if (name === null) return emptyResponse(404);

    const storage = yield* PhotoStorage;
    const bytes = yield* storage.read(name);

    if (bytes === null) return emptyResponse(404);

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  },
  (effect) =>
    effect.pipe(
      Effect.catchCause((cause) =>
        Effect.logError("Could not serve an enquiry photo", cause).pipe(
          Effect.as(emptyResponse(500)),
        ),
      ),
    ),
);
