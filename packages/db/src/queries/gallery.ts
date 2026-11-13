import type { GallerySection } from "@daniel/shared/gallery";

import { ConflictError, InvalidInputError, NotFoundError } from "@daniel/shared/errors";
import { and, eq, inArray, sql } from "drizzle-orm";
import { Effect } from "effect";

import { Database } from "../database";
import { mapDatabaseError } from "../errors";
import { galleryPhoto, galleryPhotoTheme, galleryTag } from "../schema/gallery";

const publicPhotoColumns = {
  id: true,
  storageKey: true,
  width: true,
  height: true,
  title: true,
  seriesId: true,
  placement: true,
  featured: true,
} as const;

/** The IDs of a photo's themes, read with the photo. */
const withThemeIds = { themes: { columns: { id: true } } } as const;

const adminPhotoColumns = {
  ...publicPhotoColumns,
  section: true,
  hidden: true,
  createdAt: true,
} as const;

/** Gallery order: lowest position first; among equal positions, the newest first. */
const galleryOrder = { position: "asc", createdAt: "desc" } as const;

const photoNotFound = () => new NotFoundError({ resource: "Photo" });

const tagsGone = () =>
  new ConflictError({
    reason: "A theme or series was deleted meanwhile. Reload the page and try again.",
  });

/** Replaces a photo's nested theme rows with their IDs. */
const flattenThemes = <P extends { readonly themes: ReadonlyArray<{ readonly id: string }> }>({
  themes,
  ...photo
}: P) => ({ ...photo, themeIds: themes.map((theme) => theme.id) });

/**
 * One part of the gallery as visitors see it: every photo of the section that is not hidden, in
 * gallery order. Featured work photos show as large tiles.
 */
export const listPublicGalleryPhotos = Effect.fn("db.listPublicGalleryPhotos")(function* (
  section: GallerySection,
) {
  const db = yield* Database;

  const photos = yield* db.query.galleryPhoto.findMany({
    columns: publicPhotoColumns,
    with: withThemeIds,
    where: { section: { eq: section }, hidden: { eq: false } },
    orderBy: galleryOrder,
  });

  return photos.map(flattenThemes);
}, mapDatabaseError("listPublicGalleryPhotos"));

/**
 * Every photo of every section, hidden ones included, in gallery order, for the admin area. The
 * admin area shows each section on its own.
 */
export const listAllGalleryPhotos = Effect.fn("db.listAllGalleryPhotos")(function* () {
  const db = yield* Database;

  const photos = yield* db.query.galleryPhoto.findMany({
    columns: adminPhotoColumns,
    with: withThemeIds,
    orderBy: galleryOrder,
  });

  return photos.map(flattenThemes);
}, mapDatabaseError("listAllGalleryPhotos"));

/**
 * Adds a stored photo at the start of its section and returns its ID. Fails with
 * `ConflictError`, and adds nothing, when the photo's Instagram post is already in the gallery.
 */
export const insertGalleryPhoto = Effect.fn("db.insertGalleryPhoto")(function* (
  photo: NewGalleryPhoto,
) {
  const db = yield* Database;

  const firstPosition = sql`(select coalesce(min(${galleryPhoto.position}), 0) - 1 from ${galleryPhoto} where ${galleryPhoto.section} = ${photo.section})`;

  // Uploads have no Instagram post, and nulls never conflict, so only a repeated import skips.
  const inserted = yield* db
    .insert(galleryPhoto)
    .values({ ...photo, position: firstPosition })
    .onConflictDoNothing({ target: galleryPhoto.instagramMediaId })
    .returning({ id: galleryPhoto.id });

  const created = inserted.at(0);

  if (created === undefined) {
    return yield* new ConflictError({ reason: "This Instagram post is already in the gallery" });
  }

  return created;
}, mapDatabaseError("insertGalleryPhoto"));

/**
 * Replaces the title, placement, series, and themes of a photo in one transaction. Fails, and
 * changes nothing, with `NotFoundError` when the photo is gone, with `ConflictError` when a named
 * theme or series is gone, and with `InvalidInputError` when `seriesId` names a theme or
 * `themeIds` names a series. The named tags stay locked until the update ends, so none can be
 * deleted halfway.
 */
export const updateGalleryPhotoDetails = Effect.fn("db.updateGalleryPhotoDetails")(function* (
  id: string,
  details: GalleryPhotoDetails,
) {
  const db = yield* Database;

  yield* db.transaction((tx) =>
    Effect.gen(function* () {
      const named = [...details.themeIds];

      if (details.seriesId !== null) named.push(details.seriesId);

      const tags =
        named.length === 0
          ? []
          : yield* tx
              .select({ id: galleryTag.id, kind: galleryTag.kind })
              .from(galleryTag)
              .where(inArray(galleryTag.id, named))
              .for("share");

      if (tags.length !== new Set(named).size) return yield* tagsGone();

      const kindOf = new Map(tags.map((tag) => [tag.id, tag.kind]));
      const seriesIsSeries = details.seriesId === null || kindOf.get(details.seriesId) === "series";
      const themesAreThemes = details.themeIds.every((tagId) => kindOf.get(tagId) === "theme");

      if (!seriesIsSeries || !themesAreThemes) {
        return yield* new InvalidInputError({
          reason: "Choose the series and the themes from their own lists",
        });
      }

      const updated = yield* tx
        .update(galleryPhoto)
        .set({ title: details.title, placement: details.placement, seriesId: details.seriesId })
        .where(eq(galleryPhoto.id, id))
        .returning({ id: galleryPhoto.id });

      if (updated.length === 0) return yield* photoNotFound();

      yield* tx.delete(galleryPhotoTheme).where(eq(galleryPhotoTheme.photoId, id));

      if (details.themeIds.length === 0) return;

      yield* tx
        .insert(galleryPhotoTheme)
        .values(details.themeIds.map((tagId) => ({ photoId: id, tagId })));
    }),
  );
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
 * Puts one section of the gallery in the given order, first ID first. Fails with
 * `ConflictError`, and changes nothing, unless `ids` lists every photo of the section exactly
 * once: a list made before another admin added or deleted a photo must not drop or misplace it,
 * and a photo of the other section must not move. The section's rows stay locked until the update
 * ends.
 */
export const reorderGalleryPhotos = Effect.fn("db.reorderGalleryPhotos")(function* (
  section: GallerySection,
  ids: ReadonlyArray<string>,
) {
  const db = yield* Database;

  yield* db.transaction((tx) =>
    Effect.gen(function* () {
      const current = yield* tx
        .select({ id: galleryPhoto.id })
        .from(galleryPhoto)
        .where(eq(galleryPhoto.section, section))
        .for("update");

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
        .where(and(eq(galleryPhoto.section, section), inArray(galleryPhoto.id, [...ids])));
    }),
  );
}, mapDatabaseError("reorderGalleryPhotos"));

/** The stored file and its details, as the upload records them. */
export type NewGalleryPhoto = Pick<
  typeof galleryPhoto.$inferInsert,
  "storageKey" | "width" | "height" | "createdBy" | "instagramMediaId"
> & {
  readonly section: GallerySection;
};

/** The descriptive text of a photo, its series, and its themes. `null` clears a field. */
export type GalleryPhotoDetails = {
  readonly title: string | null;
  readonly placement: string | null;
  readonly seriesId: string | null;
  readonly themeIds: ReadonlyArray<string>;
};

/** Whether a photo is featured and whether it is hidden. */
export type GalleryPhotoFlags = {
  readonly featured: boolean;
  readonly hidden: boolean;
};
