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
const insertPhoto = () =>
  insertGalleryPhoto({
    storageKey: `test/${randomUUID()}`,
    width: 1200,
    height: 1600,
    createdBy: null,
  }).pipe(Effect.map(({ id }) => id));

const galleryIds = listAllGalleryPhotos().pipe(Effect.map((photos) => photos.map(({ id }) => id)));

layer(TestDatabaseLive, { excludeTestServices: true, timeout: "60 seconds" })("gallery", (it) => {
  it.effect("puts new photos first and applies a complete reorder exactly", () =>
    Effect.gen(function* () {
      const first = yield* insertPhoto();
      const second = yield* insertPhoto();

      const before = yield* galleryIds;

      expect(before.slice(0, 2)).toEqual([second, first]);

      const reversed = before.toReversed();

      yield* reorderGalleryPhotos(reversed);

      expect(yield* galleryIds).toEqual(reversed);
    }),
  );

  it.effect("rejects a reorder that leaves out a photo and keeps the order", () =>
    Effect.gen(function* () {
      yield* insertPhoto();
      yield* insertPhoto();

      const before = yield* galleryIds;

      const error = yield* reorderGalleryPhotos(before.slice(1)).pipe(Effect.flip);

      expect(error._tag).toBe("ConflictError");
      expect(yield* galleryIds).toEqual(before);
    }),
  );

  it.effect("rejects a reorder that names an unknown photo and keeps the order", () =>
    Effect.gen(function* () {
      yield* insertPhoto();

      const before = yield* galleryIds;
      const withStranger = [...before.slice(1), randomUUID()];

      const error = yield* reorderGalleryPhotos(withStranger).pipe(Effect.flip);

      expect(error._tag).toBe("ConflictError");
      expect(yield* galleryIds).toEqual(before);
    }),
  );

  it.effect("never shows hidden photos to visitors, even when they are featured", () =>
    Effect.gen(function* () {
      const visibleFeatured = yield* insertPhoto();
      const hiddenFeatured = yield* insertPhoto();
      const hidden = yield* insertPhoto();

      yield* setGalleryPhotoFlags(visibleFeatured, { featured: true, hidden: false });
      yield* setGalleryPhotoFlags(hiddenFeatured, { featured: true, hidden: true });
      yield* setGalleryPhotoFlags(hidden, { featured: false, hidden: true });

      const publicPhotos = yield* listPublicGalleryPhotos();
      const publicIds = publicPhotos.map(({ id }) => id);

      expect(publicIds).not.toContain(hiddenFeatured);
      expect(publicIds).not.toContain(hidden);
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
