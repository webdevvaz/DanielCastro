import "@tanstack/react-start/server-only";
import type { SetGalleryPhotoFlagsInput, UpdateGalleryPhotoInput } from "@daniel/shared/gallery";

import {
  deleteGalleryPhoto,
  insertGalleryPhoto,
  reorderGalleryPhotos,
  setGalleryPhotoFlags,
  updateGalleryPhotoDetails,
} from "@daniel/db";
import { Effect } from "effect";
import { randomUUID } from "node:crypto";

import { PHOTO_SIZES, photoFileName } from "@/gallery/photo-files";

import { emptyToNull } from "../empty-to-null";
import { withAuditEvent } from "../observability/audit.server";
import { processPhoto, readPhotoUpload } from "./photo-image.server";
import { PhotoStorage } from "./photo-storage.server";

/**
 * Deletes every stored size of a photo. A failure is logged and not passed on: the photo row is
 * already gone or was never written, and a leftover file harms nothing.
 */
const removeStoredFiles = (storageKey: string) =>
  Effect.gen(function* () {
    const storage = yield* PhotoStorage;

    yield* Effect.forEach(PHOTO_SIZES, (size) => storage.remove(photoFileName(storageKey, size)), {
      discard: true,
    });
  }).pipe(
    Effect.catchCause((cause) =>
      Effect.logWarning("Could not delete stored photo files", cause).pipe(
        Effect.annotateLogs({ storageKey }),
      ),
    ),
  );

/**
 * Resizes and stores a photo, then adds it at the start of the gallery. When a step fails, the
 * files already stored are deleted again.
 */
export const addPhotoToGallery = Effect.fn("addPhotoToGallery")(function* (
  bytes: Uint8Array,
  source: PhotoSource,
) {
  const photo = yield* processPhoto(bytes);

  const storage = yield* PhotoStorage;
  const storageKey = `gallery/${randomUUID()}`;

  return yield* Effect.gen(function* () {
    yield* storage.put(photoFileName(storageKey, "large"), photo.large);
    yield* storage.put(photoFileName(storageKey, "thumb"), photo.thumb);

    return yield* insertGalleryPhoto({
      storageKey,
      width: photo.width,
      height: photo.height,
      createdBy: source.userId,
      instagramMediaId: source.instagramMediaId,
    });
  }).pipe(Effect.onError(() => removeStoredFiles(storageKey)));
});

/** Checks an uploaded photo and adds it at the start of the gallery. */
export const uploadGalleryPhoto = Effect.fn("uploadGalleryPhoto")(
  function* (userId: string, formData: FormData) {
    const bytes = yield* readPhotoUpload(formData.get("photo"));

    return yield* addPhotoToGallery(bytes, { userId, instagramMediaId: null });
  },
  (effect, userId) =>
    effect.pipe(
      withAuditEvent({
        action: "gallery.photo_uploaded",
        actorUserId: userId,
        targetType: "gallery_photo",
      }),
    ),
);

/** Saves the title, series, and placement of a photo. Empty text clears a field. */
export const updateGalleryPhoto = Effect.fn("updateGalleryPhoto")(
  function* (_userId: string, input: UpdateGalleryPhotoInput) {
    yield* updateGalleryPhotoDetails(input.id, {
      title: emptyToNull(input.title),
      series: emptyToNull(input.series),
      placement: emptyToNull(input.placement),
    });
  },
  (effect, userId, input) =>
    effect.pipe(
      withAuditEvent({
        action: "gallery.photo_updated",
        actorUserId: userId,
        targetType: "gallery_photo",
        targetId: input.id,
      }),
    ),
);

/** Sets whether a photo is featured on the home page and whether visitors can see it. */
export const changeGalleryPhotoFlags = Effect.fn("changeGalleryPhotoFlags")(
  function* (_userId: string, input: SetGalleryPhotoFlagsInput) {
    yield* setGalleryPhotoFlags(input.id, { featured: input.featured, hidden: input.hidden });
  },
  (effect, userId, input) =>
    effect.pipe(
      withAuditEvent({
        action: "gallery.photo_updated",
        actorUserId: userId,
        targetType: "gallery_photo",
        targetId: input.id,
      }),
    ),
);

/** Deletes a photo from the gallery and its stored files. */
export const removeGalleryPhoto = Effect.fn("removeGalleryPhoto")(
  function* (_userId: string, id: string) {
    const { storageKey } = yield* deleteGalleryPhoto(id);

    yield* removeStoredFiles(storageKey);
  },
  (effect, userId, id) =>
    effect.pipe(
      withAuditEvent({
        action: "gallery.photo_deleted",
        actorUserId: userId,
        targetType: "gallery_photo",
        targetId: id,
      }),
    ),
);

/** Puts the whole gallery in a new order. */
export const reorderGallery = Effect.fn("reorderGallery")(
  function* (_userId: string, ids: ReadonlyArray<string>) {
    yield* reorderGalleryPhotos(ids);
  },
  (effect, userId) =>
    effect.pipe(
      withAuditEvent({ action: "gallery.reordered", actorUserId: userId, targetType: "gallery" }),
    ),
);

/** Who added a photo, and the Instagram post it came from, if any. */
export type PhotoSource = {
  readonly userId: string;
  readonly instagramMediaId: string | null;
};
