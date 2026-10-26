import "@tanstack/react-start/server-only";
import { Effect } from "effect";

import { photoFileNameFromPath } from "@/gallery/photo-files";

import { PhotoStorage } from "./photo-storage.server";

const emptyResponse = (status: number) =>
  new Response(null, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Serves a stored gallery photo. Stored files never change (a new upload gets a new name), so
 * browsers may keep them for a year. Responds 404 for any other path or a missing file.
 */
export const getPhotoResponse = Effect.fn("getPhotoResponse")(
  function* (request: Request) {
    const name = photoFileNameFromPath(new URL(request.url).pathname);

    if (name === null) return emptyResponse(404);

    const storage = yield* PhotoStorage;
    const bytes = yield* storage.read(name);

    if (bytes === null) return emptyResponse(404);

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  },
  (effect) =>
    effect.pipe(
      Effect.catchCause((cause) =>
        Effect.logError("Could not serve a photo", cause).pipe(Effect.as(emptyResponse(500))),
      ),
    ),
);
