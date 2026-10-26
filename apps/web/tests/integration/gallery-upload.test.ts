import { Database, listAllGalleryPhotos } from "@daniel/db";
import { user } from "@daniel/db/schema";
import { TestDatabaseLive } from "@daniel/db/testing";
import { layer } from "@effect/vitest";
import { ConfigProvider, Effect, Layer } from "effect";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, expect } from "vite-plus/test";

import { uploadGalleryPhoto } from "../../src/server/gallery/gallery.server";
import { PhotoStorageLive } from "../../src/server/gallery/photo-storage.server";

const photoDirectory = mkdtempSync(join(tmpdir(), "daniel-photos-"));

afterAll(() => rmSync(photoDirectory, { recursive: true, force: true }));

const TestAppLive = PhotoStorageLive.pipe(
  Layer.provide(
    ConfigProvider.layer(ConfigProvider.fromUnknown({ PHOTO_STORAGE_DIR: photoDirectory })),
  ),
  Layer.provideMerge(TestDatabaseLive),
);

/** Every stored file, as `gallery/<name>`. */
const storedFiles = () =>
  readdirSync(join(photoDirectory, "gallery"), { withFileTypes: false }).map(
    (name) => `gallery/${name}`,
  );

const storedFilesOrNone = () => {
  try {
    return storedFiles();
  } catch {
    return [];
  }
};

/** An admin user for `createdBy`. */
const insertAdmin = Effect.gen(function* () {
  const db = yield* Database;

  const id = crypto.randomUUID();

  yield* db.insert(user).values({ id, name: "Admin", email: `${id}@example.test`, role: "admin" });

  return id;
});

const formDataWith = (bytes: Uint8Array<ArrayBuffer>, name: string, type: string) => {
  const formData = new FormData();

  formData.append("photo", new File([bytes], name, { type }));

  return formData;
};

/**
 * The upload pipeline end to end: file check, image processing, file storage, and the database
 * row, on a private PostgreSQL cluster and a temporary photo folder.
 */
layer(TestAppLive, { excludeTestServices: true, timeout: "120 seconds" })(
  "gallery upload",
  (it) => {
    it.effect("stores both sizes and adds the photo at the start of the gallery", () =>
      Effect.gen(function* () {
        const adminId = yield* insertAdmin;
        const png = yield* Effect.promise(() =>
          sharp({ create: { width: 640, height: 480, channels: 3, background: "#c1121f" } })
            .png()
            .toBuffer(),
        );

        const { id } = yield* uploadGalleryPhoto(
          adminId,
          formDataWith(new Uint8Array(png), "tattoo.png", "image/png"),
        );

        const first = (yield* listAllGalleryPhotos()).at(0);

        expect(first).toMatchObject({ id, width: 640, height: 480 });
        expect(storedFiles()).toEqual(
          expect.arrayContaining([
            `${first?.storageKey}-large.webp`,
            `${first?.storageKey}-thumb.webp`,
          ]),
        );
      }),
    );

    it.effect("rejects a file that only claims to be an image, and stores nothing", () =>
      Effect.gen(function* () {
        const adminId = yield* insertAdmin;

        const photosBefore = (yield* listAllGalleryPhotos()).length;
        const filesBefore = storedFilesOrNone();

        const fake = new TextEncoder().encode("not an image at all");

        const error = yield* Effect.flip(
          uploadGalleryPhoto(adminId, formDataWith(fake, "renamed.png", "image/png")),
        );

        expect(error._tag).toBe("InvalidInputError");
        expect((yield* listAllGalleryPhotos()).length).toBe(photosBefore);
        expect(storedFilesOrNone()).toEqual(filesBefore);
      }),
    );
  },
);
