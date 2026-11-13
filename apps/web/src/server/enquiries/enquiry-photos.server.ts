import "@tanstack/react-start/server-only";
import { InvalidInputError } from "@daniel/shared/errors";
import { Effect } from "effect";
import sharp from "sharp";

import { enquiryPhotoFileName } from "@/enquiries/enquiry-files";

import { PhotoStorage } from "../gallery/photo-storage.server";

/** Longest edge, in pixels: enough to judge a reference or a placement, small enough to email. */
const PHOTO_EDGE = 1600;

/**
 * Makes the stored copy of an enquiry photo: turned upright from its camera orientation, scaled
 * down to fit `PHOTO_EDGE`, and saved as JPEG, which every email program shows. Camera metadata,
 * such as the location, is not copied.
 */
export const processEnquiryPhoto = Effect.fn("processEnquiryPhoto")(function* (bytes: Uint8Array) {
  return yield* Effect.tryPromise({
    try: async () => {
      const { data, info } = await sharp(bytes, { failOn: "error" })
        .rotate()
        .resize({ width: PHOTO_EDGE, height: PHOTO_EDGE, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });

      return { bytes: new Uint8Array(data), width: info.width, height: info.height };
    },
    catch: () =>
      new InvalidInputError({ reason: "A photo is not a valid JPG, PNG, or WebP image" }),
  });
});

/**
 * Deletes the stored photos of an enquiry. A failure is logged and not passed on: the rows are
 * already gone or were never written, and a leftover file harms nothing.
 */
export const removeEnquiryFiles = (enquiryId: string, photoIds: ReadonlyArray<string>) =>
  Effect.gen(function* () {
    const storage = yield* PhotoStorage;

    yield* Effect.forEach(
      photoIds,
      (photoId) => storage.remove(enquiryPhotoFileName(enquiryId, photoId)),
      { discard: true },
    );
  }).pipe(
    Effect.catchCause((cause) =>
      Effect.logWarning("Could not delete stored enquiry photos", cause).pipe(
        Effect.annotateLogs({ enquiryId }),
      ),
    ),
  );
