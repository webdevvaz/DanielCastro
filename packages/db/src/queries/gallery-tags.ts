import type { GalleryTagKind } from "@daniel/shared/gallery";

import { ConflictError, NotFoundError } from "@daniel/shared/errors";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { Effect } from "effect";

import type { DatabaseExecutor } from "../transaction";

import { Database } from "../database";
import { mapDatabaseError } from "../errors";
import { galleryTag } from "../schema/gallery";

const tagColumns = {
  id: true,
  kind: true,
  name: true,
  nameEn: true,
  namePt: true,
  nameFr: true,
  nameDe: true,
  nameEs: true,
} as const;

const KIND_LABELS: Record<GalleryTagKind, string> = { theme: "theme", series: "series" };

const tagNotFound = () => new NotFoundError({ resource: "Theme or series" });

const duplicateName = (kind: GalleryTagKind) =>
  new ConflictError({ reason: `A ${KIND_LABELS[kind]} with this name already exists` });

/**
 * Fails with `ConflictError` when another tag of the kind has the name, ignoring case. `exceptId`
 * leaves out the tag being renamed. The unique index repeats the rule for concurrent writes.
 */
const ensureNameFree = Effect.fn("ensureNameFree")(function* (
  executor: DatabaseExecutor,
  kind: GalleryTagKind,
  name: string,
  exceptId: string | null,
) {
  const sameName = and(
    eq(galleryTag.kind, kind),
    eq(sql`lower(${galleryTag.name})`, name.toLowerCase()),
  );

  const where = exceptId === null ? sameName : and(sameName, ne(galleryTag.id, exceptId));

  const taken = yield* executor
    .select({ id: galleryTag.id })
    .from(galleryTag)
    .where(where)
    .limit(1);

  if (taken.length > 0) return yield* duplicateName(kind);
});

/** Every theme and series in list order: lowest position first, then the oldest first. */
export const listGalleryTags = Effect.fn("db.listGalleryTags")(function* () {
  const db = yield* Database;

  return yield* db.query.galleryTag.findMany({
    columns: tagColumns,
    orderBy: { position: "asc", createdAt: "asc" },
  });
}, mapDatabaseError("listGalleryTags"));

/**
 * Adds a theme or series at the end of its list and returns its ID. Fails with `ConflictError`,
 * and adds nothing, when one of the kind already has the name.
 */
export const insertGalleryTag = Effect.fn("db.insertGalleryTag")(function* (
  kind: GalleryTagKind,
  names: GalleryTagNameColumns,
) {
  const db = yield* Database;

  yield* ensureNameFree(db, kind, names.name, null);

  const nextPosition = sql`(select coalesce(max(${galleryTag.position}), -1) + 1 from ${galleryTag} where ${galleryTag.kind} = ${kind})`;

  const inserted = yield* db
    .insert(galleryTag)
    .values({ kind, ...names, position: nextPosition })
    .onConflictDoNothing()
    .returning({ id: galleryTag.id });

  const created = inserted.at(0);

  if (created === undefined) return yield* duplicateName(kind);

  return created;
}, mapDatabaseError("insertGalleryTag"));

/**
 * Replaces the name and translations of a theme or series. Fails with `NotFoundError` when it is
 * gone, and with `ConflictError`, changing nothing, when another one of its kind has the name.
 */
export const updateGalleryTagNames = Effect.fn("db.updateGalleryTagNames")(function* (
  id: string,
  names: GalleryTagNameColumns,
) {
  const db = yield* Database;

  yield* db.transaction((tx) =>
    Effect.gen(function* () {
      const current = yield* tx
        .select({ kind: galleryTag.kind })
        .from(galleryTag)
        .where(eq(galleryTag.id, id))
        .for("update");

      const tag = current.at(0);

      if (tag === undefined) return yield* tagNotFound();

      yield* ensureNameFree(tx, tag.kind, names.name, id);

      yield* tx.update(galleryTag).set(names).where(eq(galleryTag.id, id));
    }),
  );
}, mapDatabaseError("updateGalleryTagNames"));

/**
 * Deletes a theme or series. Photos lose the theme, or have no series, and stay in the gallery.
 */
export const deleteGalleryTag = Effect.fn("db.deleteGalleryTag")(function* (id: string) {
  const db = yield* Database;

  const deleted = yield* db
    .delete(galleryTag)
    .where(eq(galleryTag.id, id))
    .returning({ id: galleryTag.id });

  if (deleted.length === 0) return yield* tagNotFound();
}, mapDatabaseError("deleteGalleryTag"));

/**
 * Puts the themes, or the series, in the given order, first ID first. Fails with
 * `ConflictError`, and changes nothing, unless `ids` lists every one of the kind exactly once.
 */
export const reorderGalleryTags = Effect.fn("db.reorderGalleryTags")(function* (
  kind: GalleryTagKind,
  ids: ReadonlyArray<string>,
) {
  const db = yield* Database;

  yield* db.transaction((tx) =>
    Effect.gen(function* () {
      const current = yield* tx
        .select({ id: galleryTag.id })
        .from(galleryTag)
        .where(eq(galleryTag.kind, kind))
        .for("update");

      const currentIds = new Set(current.map((row) => row.id));
      const listsEveryTag = currentIds.size === ids.length && ids.every((id) => currentIds.has(id));

      if (!listsEveryTag) {
        return yield* new ConflictError({
          reason: "The list changed while you were sorting it. Reload the page and try again.",
        });
      }

      if (ids.length === 0) return;

      const positions = sql.join(
        ids.map((id, index) => sql`when ${id}::uuid then ${index}`),
        sql` `,
      );

      yield* tx
        .update(galleryTag)
        .set({ position: sql`(case ${galleryTag.id} ${positions} end)::integer` })
        .where(and(eq(galleryTag.kind, kind), inArray(galleryTag.id, [...ids])));
    }),
  );
}, mapDatabaseError("reorderGalleryTags"));

/** The name of a theme or series and its translation in each site language; null shows `name`. */
export type GalleryTagNameColumns = Pick<
  typeof galleryTag.$inferInsert,
  "name" | "nameEn" | "namePt" | "nameFr" | "nameDe" | "nameEs"
> & { readonly name: string };
