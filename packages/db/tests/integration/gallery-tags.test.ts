import type { GalleryTagKind } from "@daniel/shared/gallery";

import { layer } from "@effect/vitest";
import { Effect } from "effect";
import { randomUUID } from "node:crypto";
import { expect } from "vite-plus/test";

import {
  deleteGalleryTag,
  insertGalleryPhoto,
  insertGalleryTag,
  listAllGalleryPhotos,
  listGalleryTags,
  listPublicGalleryPhotos,
  reorderGalleryTags,
  updateGalleryPhotoDetails,
  updateGalleryTagNames,
} from "../../src";
import { TestDatabaseLive } from "../support/private-postgres";

/** A name no other test uses, so tests sharing the cluster never collide. */
const uniqueName = (base: string) => `${base} ${randomUUID().slice(0, 8)}`;

const names = (name: string) => ({
  name,
  nameEn: null,
  namePt: null,
  nameFr: null,
  nameDe: null,
  nameEs: null,
});

const insertTag = (kind: GalleryTagKind, base: string) =>
  insertGalleryTag(kind, names(uniqueName(base))).pipe(Effect.map(({ id }) => id));

const insertPhoto = Effect.suspend(() =>
  insertGalleryPhoto({
    storageKey: `test/${randomUUID()}`,
    section: "work",
    width: 1200,
    height: 1600,
    createdBy: null,
    instagramMediaId: null,
  }),
).pipe(Effect.map(({ id }) => id));

/** A photo as the admin area lists it, with its theme IDs sorted for comparison. */
const adminPhoto = (id: string) =>
  listAllGalleryPhotos().pipe(
    Effect.map((photos) => photos.find((photo) => photo.id === id)),
    Effect.map((photo) =>
      photo === undefined
        ? undefined
        : { title: photo.title, seriesId: photo.seriesId, themeIds: photo.themeIds.toSorted() },
    ),
  );

const kindIds = (kind: GalleryTagKind) =>
  listGalleryTags().pipe(
    Effect.map((tags) => tags.filter((tag) => tag.kind === kind).map(({ id }) => id)),
  );

layer(TestDatabaseLive, { excludeTestServices: true, timeout: "60 seconds" })(
  "gallery themes and series",
  (it) => {
    it.effect(
      "saves a photo's series and themes, and rejects wrong kinds and deleted tags without writing",
      () =>
        Effect.gen(function* () {
          const series = yield* insertTag("series", "Berserk");
          const anime = yield* insertTag("theme", "Anime");
          const dark = yield* insertTag("theme", "Dark fantasy");
          const photo = yield* insertPhoto;

          yield* updateGalleryPhotoDetails(photo, {
            title: "Skull Knight",
            placement: null,
            seriesId: series,
            themeIds: [anime, dark],
          });

          const saved = {
            title: "Skull Knight",
            seriesId: series,
            themeIds: [anime, dark].toSorted(),
          };

          expect(yield* adminPhoto(photo)).toEqual(saved);

          const visitorView = (yield* listPublicGalleryPhotos("work")).find(
            ({ id }) => id === photo,
          );

          expect(visitorView?.seriesId).toBe(series);
          expect(visitorView?.themeIds.toSorted()).toEqual(saved.themeIds);

          const attempts = [
            { seriesId: anime, themeIds: [dark], expected: "InvalidInputError" },
            { seriesId: null, themeIds: [series], expected: "InvalidInputError" },
            { seriesId: series, themeIds: [anime, randomUUID()], expected: "ConflictError" },
            { seriesId: randomUUID(), themeIds: [], expected: "ConflictError" },
          ];

          for (const attempt of attempts) {
            const error = yield* updateGalleryPhotoDetails(photo, {
              title: "Changed",
              placement: "Back",
              seriesId: attempt.seriesId,
              themeIds: attempt.themeIds,
            }).pipe(Effect.flip);

            expect(error._tag).toBe(attempt.expected);
            expect(yield* adminPhoto(photo)).toEqual(saved);
          }

          const missing = yield* updateGalleryPhotoDetails(randomUUID(), {
            title: null,
            placement: null,
            seriesId: series,
            themeIds: [anime],
          }).pipe(Effect.flip);

          expect(missing._tag).toBe("NotFoundError");
        }),
    );

    it.effect("keeps photos in the gallery when their theme or series is deleted", () =>
      Effect.gen(function* () {
        const series = yield* insertTag("series", "Naruto");
        const anime = yield* insertTag("theme", "Anime");
        const gothic = yield* insertTag("theme", "Gothic");
        const photo = yield* insertPhoto;

        yield* updateGalleryPhotoDetails(photo, {
          title: "Madara",
          placement: null,
          seriesId: series,
          themeIds: [anime, gothic],
        });

        yield* deleteGalleryTag(anime);
        yield* deleteGalleryTag(series);

        expect(yield* adminPhoto(photo)).toEqual({
          title: "Madara",
          seriesId: null,
          themeIds: [gothic],
        });

        const again = yield* deleteGalleryTag(anime).pipe(Effect.flip);

        expect(again._tag).toBe("NotFoundError");
      }),
    );

    it.effect("refuses a repeated name within a kind, ignoring case, but not across kinds", () =>
      Effect.gen(function* () {
        const name = uniqueName("Video games");

        const theme = yield* insertGalleryTag("theme", names(name));
        const other = yield* insertTag("theme", "Films");

        const duplicate = yield* insertGalleryTag("theme", names(name.toUpperCase())).pipe(
          Effect.flip,
        );

        expect(duplicate._tag).toBe("ConflictError");

        const renamed = yield* updateGalleryTagNames(other, names(name.toLowerCase())).pipe(
          Effect.flip,
        );

        expect(renamed._tag).toBe("ConflictError");

        // A series may share a theme's name, and a tag may keep its own name with new translations.
        yield* insertGalleryTag("series", names(name));
        yield* updateGalleryTagNames(theme.id, { ...names(name), namePt: "Videojogos" });

        const tags = yield* listGalleryTags();

        expect(tags.filter((tag) => tag.name.toLowerCase() === name.toLowerCase()).length).toBe(2);
        expect(tags.find((tag) => tag.id === other)?.name).not.toBe(name.toLowerCase());
        expect(tags.find((tag) => tag.id === theme.id)?.namePt).toBe("Videojogos");
      }),
    );

    it.effect("applies a complete reorder of one kind and refuses a stale one", () =>
      Effect.gen(function* () {
        yield* insertTag("theme", "Mythologies");
        yield* insertTag("theme", "Spooky");

        const before = yield* kindIds("theme");
        const seriesBefore = yield* kindIds("series");

        const stale = yield* reorderGalleryTags("theme", before.slice(1)).pipe(Effect.flip);

        expect(stale._tag).toBe("ConflictError");
        expect(yield* kindIds("theme")).toEqual(before);

        yield* reorderGalleryTags("theme", before.toReversed());

        expect(yield* kindIds("theme")).toEqual(before.toReversed());
        expect(yield* kindIds("series")).toEqual(seriesBefore);
      }),
    );
  },
);
