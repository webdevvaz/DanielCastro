import "@tanstack/react-start/server-only";
import type { GalleryUploadMimeType } from "@daniel/shared/gallery";

import { InvalidInputError } from "@daniel/shared/errors";
import { Effect } from "effect";
import sharp from "sharp";

/** Longest edge, in pixels, of the photo shown at full size. */
const LARGE_EDGE = 2000;

/** Longest edge, in pixels, of the photo shown in grids. */
const THUMB_EDGE = 720;

const invalidPhoto = () =>
  new InvalidInputError({ reason: "The selected file is not a valid JPG, PNG, or WebP image" });

const hasBytes = (bytes: Uint8Array, expected: ReadonlyArray<number>, offset = 0) =>
  expected.every((value, index) => bytes[offset + index] === value);

/** Identifies an image by its first bytes, so a renamed file cannot pass as a photo. */
function detectPhotoMimeType(bytes: Uint8Array): GalleryUploadMimeType | null {
  if (hasBytes(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";

  if (hasBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";

  const hasRiffHeader = hasBytes(bytes, [0x52, 0x49, 0x46, 0x46]);
  const hasWebpHeader = hasBytes(bytes, [0x57, 0x45, 0x42, 0x50], 8);

  if (hasRiffHeader && hasWebpHeader) return "image/webp";

  return null;
}

/**
 * Reads the uploaded file and checks that its content matches its declared type. Fails with
 * `InvalidInputError` when the entry is missing, unreadable, or not a supported image.
 */
export const readPhotoUpload = Effect.fn("readPhotoUpload")(function* (
  entry: FormDataEntryValue | null,
) {
  if (!(entry instanceof File)) return yield* invalidPhoto();

  const buffer = yield* Effect.tryPromise({ try: () => entry.arrayBuffer(), catch: invalidPhoto });

  const bytes = new Uint8Array(buffer);

  if (detectPhotoMimeType(bytes) !== entry.type) return yield* invalidPhoto();

  return bytes;
});

/**
 * Fails with `InvalidInputError` unless the bytes are a JPG, PNG, or WebP image. Use it for
 * images the site downloads, which have no declared type to compare.
 */
export const checkPhotoBytes = Effect.fn("checkPhotoBytes")(function* (bytes: Uint8Array) {
  if (detectPhotoMimeType(bytes) === null) return yield* invalidPhoto();

  return bytes;
});

/**
 * Makes the stored sizes of a photo: turned upright from its camera orientation, scaled down to
 * fit `LARGE_EDGE` and `THUMB_EDGE`, and saved as WebP. Camera metadata, such as the location,
 * is not copied.
 */
export const processPhoto = Effect.fn("processPhoto")(function* (bytes: Uint8Array) {
  return yield* Effect.tryPromise({
    try: async () => {
      const source = sharp(bytes, { failOn: "error" }).rotate();

      const large = await source
        .clone()
        .resize({ width: LARGE_EDGE, height: LARGE_EDGE, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });

      const thumb = await source
        .clone()
        .resize({ width: THUMB_EDGE, height: THUMB_EDGE, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 78 })
        .toBuffer();

      return { large: large.data, thumb, width: large.info.width, height: large.info.height };
    },
    catch: invalidPhoto,
  });
});
