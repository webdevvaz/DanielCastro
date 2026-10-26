import "@tanstack/react-start/server-only";
import { Config, Context, Effect, Layer, Predicate, Schema } from "effect";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";

const isMissingFile = (error: unknown) =>
  Predicate.hasProperty(error, "code") && error.code === "ENOENT";

/** A failure to write, read, or delete a stored photo file. */
class PhotoStorageError extends Schema.TaggedError<PhotoStorageError>()("PhotoStorageError", {
  operation: Schema.String,
  cause: Schema.Defect(),
}) {}

const attempt = <A>(operation: string, run: () => Promise<A>) =>
  Effect.tryPromise({
    try: run,
    catch: (cause) => new PhotoStorageError({ operation, cause }),
  }).pipe(Effect.withSpan(`photoStorage.${operation}`));

const makeFileSystemStorage = Effect.gen(function* () {
  const directory = yield* Config.String("PHOTO_STORAGE_DIR").pipe(
    Config.withDefault(".data/photos"),
  );

  const root = resolve(directory);

  // Names come from storage keys the server creates, but a path must never leave the root.
  const pathOf = (name: string) => {
    const path = resolve(root, name);

    return path.startsWith(`${root}${sep}`)
      ? Effect.succeed(path)
      : Effect.die(new Error(`Photo file name outside the storage folder: ${name}`));
  };

  return PhotoStorage.of({
    put: (name, bytes) =>
      Effect.flatMap(pathOf(name), (path) =>
        attempt("put", async () => {
          await mkdir(dirname(path), { recursive: true });
          await writeFile(path, bytes);
        }),
      ),
    read: (name) =>
      Effect.flatMap(pathOf(name), (path) =>
        attempt("read", async () => {
          try {
            return await readFile(path);
          } catch (error) {
            if (isMissingFile(error)) return null;

            throw error;
          }
        }),
      ),
    remove: (name) =>
      Effect.flatMap(pathOf(name), (path) => attempt("remove", () => rm(path, { force: true }))),
  });
});

/** Stores gallery photo files. */
export class PhotoStorage extends Context.Service<PhotoStorage, PhotoStorageService>()(
  "web/PhotoStorage",
) {}

/**
 * Photo storage in a folder on the server's disk: `PHOTO_STORAGE_DIR`, by default `.data/photos`
 * below the folder the server starts in. Replace this layer with object storage (S3 or R2) when
 * the server's disk is not permanent.
 */
export const PhotoStorageLive = Layer.effect(PhotoStorage, makeFileSystemStorage);

/** Operations on stored photo files, by file name (see `gallery/photo-files.ts`). */
export type PhotoStorageService = {
  readonly put: (name: string, bytes: Uint8Array) => Effect.Effect<void, PhotoStorageError>;
  /** The file's bytes, or null when it does not exist. */
  readonly read: (name: string) => Effect.Effect<Uint8Array<ArrayBuffer> | null, PhotoStorageError>;
  /** Deletes a file. A file that does not exist is not an error. */
  readonly remove: (name: string) => Effect.Effect<void, PhotoStorageError>;
};
