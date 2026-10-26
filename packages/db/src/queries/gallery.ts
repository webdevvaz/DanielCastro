import { ConflictError, NotFoundError } from "@daniel/shared/errors";
import { eq, inArray, sql } from "drizzle-orm";
import { Effect } from "effect";

import { Database } from "../database";
import { mapDatabaseError } from "../errors";
import { galleryPhoto } from "../schema/gallery";

const publicPhotoColumns = {
  id: true,
  storageKey: true,
  width: true,
  height: true,
  title: true,
  series: true,
  placement: true,
  featured: true,
} as const;

const adminPhotoColumns = {
  ...publicPhotoColumns,
  hidden: true,
  createdAt: true,
} as const;

/** Gallery order: lowest position first; among equal positions, the newest first. */
const galleryOrder = { position: "asc", createdAt: "desc" } as const;

const photoNotFound = () => new NotFoundError({ resource: "Photo" });

/**
 * The gallery as visitors see it: every photo that is not hidden, in gallery order. Featured
 * photos show as large tiles.
 */
export const listPublicGalleryPhotos = Effect.fn("db.listPublicGalleryPhotos")(function* () {
  const db = yield* Database;

  return yield* db.query.galleryPhoto.findMany({
    columns: publicPhotoColumns,
    where: { hidden: { eq: false } },
    orderBy: galleryOrder,
  });
}, mapDatabaseError("listPublicGalleryPhotos"));

/** Every photo, hidden ones included, in gallery order, for the admin area. */
export const listAllGalleryPhotos = Effect.fn("db.listAllGalleryPhotos")(function* () {
  const db = yield* Database;

  return yield* db.query.galleryPhoto.findMany({
    columns: adminPhotoColumns,
    orderBy: galleryOrder,
  });
}, mapDatabaseError("listAllGalleryPhotos"));

/**
 * Adds a stored photo at the start of the gallery and returns its ID. Fails with
 * `ConflictError`, and adds nothing, when the photo's Instagram post is already in the gallery.
 */
export const insertGalleryPhoto = Effect.fn("db.insertGalleryPhoto")(function* (
  photo: NewGalleryPhoto,
) {
  const db = yield* Database;

  // Uploads have no Instagram post, and nulls never conflict, so only a repeated import skips.
  const inserted = yield* db
    .insert(galleryPhoto)
    .values({
      ...photo,
      position: sql`(select coalesce(min(${galleryPhoto.position}), 0) - 1 from ${galleryPhoto})`,
    })
    .onConflictDoNothing({ target: galleryPhoto.instagramMediaId })
    .returning({ id: galleryPhoto.id });

  const created = inserted.at(0);

  if (created === undefined) {
    return yield* new ConflictError({ reason: "This Instagram post is already in the gallery" });
  }

  return created;
}, mapDatabaseError("insertGalleryPhoto"));

/** Replaces the title, series, and placement of a photo. */
export const updateGalleryPhotoDetails = Effect.fn("db.updateGalleryPhotoDetails")(function* (
  id: string,
  details: GalleryPhotoDetails,
) {
  const db = yield* Database;

  const updated = yield* db
    .update(galleryPhoto)
    .set(details)
    .where(eq(galleryPhoto.id, id))
    .returning({ id: galleryPhoto.id });

  if (updated.length === 0) return yield* photoNotFound();
}, mapDatabaseError("updateGalleryPhotoDetails"));

/** Sets whether a photo is featured on the home page and whether it is hidden from visitors. */
export const setGalleryPhotoFlags = Effect.fn("db.setGalleryPhotoFlags")(function* (
  id: string,
  flags: GalleryPhotoFlags,
) {
  const db = yield* Database;

  const updated = yield* db
    .update(galleryPhoto)
    .set(flags)
    .where(eq(galleryPhoto.id, id))
    .returning({ id: galleryPhoto.id });

  if (updated.length === 0) return yield* photoNotFound();
}, mapDatabaseError("setGalleryPhotoFlags"));

/** Deletes a photo and returns its storage key, so the caller can delete the stored files. */
export const deleteGalleryPhoto = Effect.fn("db.deleteGalleryPhoto")(function* (id: string) {
  const db = yield* Database;

  const deleted = yield* db
    .delete(galleryPhoto)
    .where(eq(galleryPhoto.id, id))
    .returning({ storageKey: galleryPhoto.storageKey });

  const photo = deleted.at(0);

  if (photo === undefined) return yield* photoNotFound();

  return photo;
}, mapDatabaseError("deleteGalleryPhoto"));

/**
 * Puts the gallery in the given order, first ID first. Fails with `ConflictError`, and changes
 * nothing, unless `ids` lists every photo exactly once: a list made before another admin added
 * or deleted a photo must not drop or misplace it. The rows stay locked until the update ends.
 */
export const reorderGalleryPhotos = Effect.fn("db.reorderGalleryPhotos")(function* (
  ids: ReadonlyArray<string>,
) {
  const db = yield* Database;

  yield* db.transaction((tx) =>
    Effect.gen(function* () {
      const current = yield* tx.select({ id: galleryPhoto.id }).from(galleryPhoto).for("update");

      const currentIds = new Set(current.map((row) => row.id));
      const listsEveryPhoto =
        currentIds.size === ids.length && ids.every((id) => currentIds.has(id));

      if (!listsEveryPhoto) {
        return yield* new ConflictError({
          reason: "The gallery changed while you were sorting it. Reload the page and try again.",
        });
      }

      if (ids.length === 0) return;

      const positions = sql.join(
        ids.map((id, index) => sql`when ${id}::uuid then ${index}`),
        sql` `,
      );

      yield* tx
        .update(galleryPhoto)
        .set({ position: sql`(case ${galleryPhoto.id} ${positions} end)::integer` })
        .where(inArray(galleryPhoto.id, [...ids]));
    }),
  );
}, mapDatabaseError("reorderGalleryPhotos"));

/** The stored file and its details, as the upload records them. */
export type NewGalleryPhoto = Pick<
  typeof galleryPhoto.$inferInsert,
  "storageKey" | "width" | "height" | "createdBy" | "instagramMediaId"
>;

/** The descriptive text of a photo. `null` clears a field. */
export type GalleryPhotoDetails = {
  readonly title: string | null;
  readonly series: string | null;
  readonly placement: string | null;
};

/** Whether a photo is featured and whether it is hidden. */
export type GalleryPhotoFlags = {
  readonly featured: boolean;
  readonly hidden: boolean;
};
