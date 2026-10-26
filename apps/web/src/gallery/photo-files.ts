/** Where the browser loads gallery photos from (`routes/api/photos/$.ts`). */
const PHOTO_ROUTE = "/api/photos";

/**
 * A stored photo file name: the storage key (`gallery/<uuid>`) and the size. Only names of this
 * shape are served, so a request cannot reach any other file.
 */
const PHOTO_FILE_PATTERN =
  /^gallery\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-(?:large|thumb)\.webp$/;

/** The sizes stored for every gallery photo: `large` for viewing, `thumb` for grids. */
export const PHOTO_SIZES = ["large", "thumb"] as const;

/** The file name of one size of a stored photo. */
export const photoFileName = (storageKey: string, size: PhotoSize) => `${storageKey}-${size}.webp`;

/** The URL of one size of a stored photo. */
export const photoUrl = (storageKey: string, size: PhotoSize) =>
  `${PHOTO_ROUTE}/${photoFileName(storageKey, size)}`;

/**
 * The stored file name a photo URL path asks for, or null when the path is not a photo URL.
 * `%2F` and `..` cannot pass: the decoded name must match the stored-name pattern exactly.
 */
export function photoFileNameFromPath(pathname: string) {
  if (!pathname.startsWith(`${PHOTO_ROUTE}/`)) return null;

  const encoded = pathname.slice(PHOTO_ROUTE.length + 1);

  let name: string;

  try {
    name = decodeURIComponent(encoded);
  } catch {
    return null;
  }

  return PHOTO_FILE_PATTERN.test(name) ? name : null;
}

/** A stored photo size. */
export type PhotoSize = (typeof PHOTO_SIZES)[number];
