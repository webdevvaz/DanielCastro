import "@tanstack/react-start/server-only";
import type {
  CreateGalleryTagInput,
  GalleryTagKind,
  GalleryTagNames,
  UpdateGalleryTagInput,
} from "@daniel/shared/gallery";

import {
  deleteGalleryTag,
  insertGalleryTag,
  reorderGalleryTags,
  updateGalleryTagNames,
} from "@daniel/db";
import { Effect } from "effect";

import { emptyToNull } from "../empty-to-null";
import { withAuditEvent } from "../observability/audit.server";

/** The stored columns of a name and its translations. An empty translation is stored as null. */
const nameColumns = ({ name, translations }: GalleryTagNames) => ({
  name,
  nameEn: emptyToNull(translations.en),
  namePt: emptyToNull(translations.pt),
  nameFr: emptyToNull(translations.fr),
  nameDe: emptyToNull(translations.de),
  nameEs: emptyToNull(translations.es),
});

/** Adds a theme or series at the end of its list. */
export const createGalleryTag = Effect.fn("createGalleryTag")(
  function* (_userId: string, input: CreateGalleryTagInput) {
    return yield* insertGalleryTag(input.kind, nameColumns(input));
  },
  (effect, userId) =>
    effect.pipe(
      withAuditEvent({
        action: "gallery.tag_created",
        actorUserId: userId,
        targetType: "gallery_tag",
      }),
    ),
);

/** Renames a theme or series, or changes its translations. */
export const renameGalleryTag = Effect.fn("renameGalleryTag")(
  function* (_userId: string, input: UpdateGalleryTagInput) {
    yield* updateGalleryTagNames(input.id, nameColumns(input));
  },
  (effect, userId, input) =>
    effect.pipe(
      withAuditEvent({
        action: "gallery.tag_updated",
        actorUserId: userId,
        targetType: "gallery_tag",
        targetId: input.id,
      }),
    ),
);

/** Deletes a theme or series. Its photos stay in the gallery without it. */
export const removeGalleryTag = Effect.fn("removeGalleryTag")(
  function* (_userId: string, id: string) {
    yield* deleteGalleryTag(id);
  },
  (effect, userId, id) =>
    effect.pipe(
      withAuditEvent({
        action: "gallery.tag_deleted",
        actorUserId: userId,
        targetType: "gallery_tag",
        targetId: id,
      }),
    ),
);

/** Puts the themes, or the series, in a new order. */
export const reorderTags = Effect.fn("reorderTags")(
  function* (_userId: string, kind: GalleryTagKind, ids: ReadonlyArray<string>) {
    yield* reorderGalleryTags(kind, ids);
  },
  (effect, userId, kind) =>
    effect.pipe(
      withAuditEvent({
        action: "gallery.tags_reordered",
        actorUserId: userId,
        targetType: "gallery_tag",
        targetId: kind,
      }),
    ),
);
