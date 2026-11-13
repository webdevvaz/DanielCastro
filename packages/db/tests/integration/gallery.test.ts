import type { GallerySection } from "@daniel/shared/gallery";

import { layer } from "@effect/vitest";
import { Effect } from "effect";
import { randomUUID } from "node:crypto";
import { expect } from "vite-plus/test";

import {
  insertGalleryPhoto,
  listAllGalleryPhotos,
  listPublicGalleryPhotos,
  reorderGalleryPhotos,
  setGalleryPhotoFlags,
} from "../../src";
import { TestDatabaseLive } from "../support/private-postgres";

/** Stores a photo row with a unique storage key, as an upload would. */
const insertPhoto = (section: GallerySection = "work") =>
  insertGalleryPhoto({
    storageKey: `test/${randomUUID()}`,
    section,
    width: 1200,
    height: 1600,
    createdBy: null,
    instagramMediaId: null,
  }).pipe(Effect.map(({ id }) => id));

/** The IDs of one section, in gallery order, hidden photos included. */
const sectionIds = (section: GallerySection) =>
  listAllGalleryPhotos().pipe(
    Effect.map((photos) => photos.filter((photo) => photo.section === section).map(({ id }) => id)),
  );

const publicIds = (section: GallerySection) =>
  listPublicGalleryPhotos(section).pipe(Effect.map((photos) => photos.map(({ id }) => id)));

layer(TestDatabaseLive, { excludeTestServices: true, timeout: "60 seconds" })("gallery", (it) => {
  it.effect("puts new photos first and applies a complete reorder exactly", () =>
    Effect.gen(function* () {
      const first = yield* insertPhoto();
      const second = yield* insertPhoto();

      const before = yield* sectionIds("work");

      expect(before.slice(0, 2)).toEqual([second, first]);

      const reversed = before.toReversed();

      yield* reorderGalleryPhotos("work", reversed);

      expect(yield* sectionIds("work")).toEqual(reversed);
    }),
  );

  it.effect("rejects a reorder that leaves out a photo and keeps the order", () =>
    Effect.gen(function* () {
      yield* insertPhoto();
      yield* insertPhoto();

      const before = yield* sectionIds("work");

      const error = yield* reorderGalleryPhotos("work", before.slice(1)).pipe(Effect.flip);

      expect(error._tag).toBe("ConflictError");
      expect(yield* sectionIds("work")).toEqual(before);
    }),
  );

  it.effect("rejects a reorder that names an unknown photo and keeps the order", () =>
    Effect.gen(function* () {
      yield* insertPhoto();

      const before = yield* sectionIds("work");
      const withStranger = [...before.slice(1), randomUUID()];

      const error = yield* reorderGalleryPhotos("work", withStranger).pipe(Effect.flip);

      expect(error._tag).toBe("ConflictError");
      expect(yield* sectionIds("work")).toEqual(before);
    }),
  );

  it.effect("keeps the work and studio sections apart for visitors, uploads, and reorders", () =>
    Effect.gen(function* () {
      const work = yield* insertPhoto("work");
      const studioFirst = yield* insertPhoto("studio");
      const studioSecond = yield* insertPhoto("studio");

      const workPublic = yield* publicIds("work");
      const studioPublic = yield* publicIds("studio");

      expect(workPublic).toContain(work);
      expect(workPublic).not.toContain(studioFirst);
      expect(studioPublic).toEqual(expect.arrayContaining([studioFirst, studioSecond]));
      expect(studioPublic).not.toContain(work);

      // A new studio photo goes first in the studio, counted within the studio only.
      const workBefore = yield* sectionIds("work");
      const studioBefore = yield* sectionIds("studio");

      expect(studioBefore.slice(0, 2)).toEqual([studioSecond, studioFirst]);

      // A studio reorder that lists a work photo is refused, and neither section moves.
      const mixed = [...studioBefore, work];
      const error = yield* reorderGalleryPhotos("studio", mixed).pipe(Effect.flip);

      expect(error._tag).toBe("ConflictError");
      expect(yield* sectionIds("studio")).toEqual(studioBefore);
      expect(yield* sectionIds("work")).toEqual(workBefore);

      // A complete studio reorder changes the studio only.
      yield* reorderGalleryPhotos("studio", studioBefore.toReversed());

      expect(yield* sectionIds("studio")).toEqual(studioBefore.toReversed());
      expect(yield* sectionIds("work")).toEqual(workBefore);
    }),
  );

  it.effect("never shows hidden photos to visitors, even when they are featured", () =>
    Effect.gen(function* () {
      const visibleFeatured = yield* insertPhoto();
      const hiddenFeatured = yield* insertPhoto();
      const hidden = yield* insertPhoto();
      const hiddenStudio = yield* insertPhoto("studio");

      yield* setGalleryPhotoFlags(visibleFeatured, { featured: true, hidden: false });
      yield* setGalleryPhotoFlags(hiddenFeatured, { featured: true, hidden: true });
      yield* setGalleryPhotoFlags(hidden, { featured: false, hidden: true });
      yield* setGalleryPhotoFlags(hiddenStudio, { featured: false, hidden: true });

      const publicPhotos = yield* listPublicGalleryPhotos("work");
      const workPublic = publicPhotos.map(({ id }) => id);

      expect(workPublic).not.toContain(hiddenFeatured);
      expect(workPublic).not.toContain(hidden);
      expect(yield* publicIds("studio")).not.toContain(hiddenStudio);
      expect(publicPhotos.find(({ id }) => id === visibleFeatured)?.featured).toBe(true);
    }),
  );

  it.effect("reports a missing photo as not found", () =>
    Effect.gen(function* () {
      const error = yield* setGalleryPhotoFlags(randomUUID(), {
        featured: true,
        hidden: false,
      }).pipe(Effect.flip);

      expect(error._tag).toBe("NotFoundError");
    }),
  );
});
