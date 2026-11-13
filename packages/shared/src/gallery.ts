import { Schema } from "effect";

import { SiteLocale } from "./locales";
import { optionalText, requiredText } from "./schema-fields";

/** Longest title or placement text on a gallery photo. */
const DETAIL_MAX_LENGTH = 120;

/** Most photos one reorder request may list. */
const REORDER_MAX_PHOTOS = 2000;

/** Longest name of a theme or series, in any language. */
const TAG_NAME_MAX_LENGTH = 60;

/** Most themes or series one list may hold, and so the most one request may name. */
const TAG_LIST_MAX = 500;

/** A list of distinct theme or series IDs, as a reorder or a photo's themes send them. */
const distinctTagIds = (label: string) =>
  Schema.Array(GalleryTagId).check(
    Schema.isMaxLength(TAG_LIST_MAX),
    Schema.makeFilter(
      (ids: ReadonlyArray<string>) =>
        new Set(ids).size === ids.length || `Each ${label} may appear once`,
    ),
  );

/**
 * The parts of the gallery: `work` is Daniel's tattoos (the Work page), `studio` is photos of the
 * studio (the About page). Each part has its own order.
 */
export const GALLERY_SECTIONS = ["work", "studio"] as const;

/** One part of the gallery. */
export const GallerySection = Schema.Literals(GALLERY_SECTIONS);

/** Selects one part of the gallery. */
export const GallerySectionInput = Schema.Struct({
  section: GallerySection,
});

/** Largest accepted gallery upload, in megabytes. */
export const GALLERY_UPLOAD_MAX_MEGABYTES = 25;

/** Largest accepted gallery upload, in bytes. */
export const GALLERY_UPLOAD_MAX_BYTES = GALLERY_UPLOAD_MAX_MEGABYTES * 1024 * 1024;

/** Image types accepted for gallery uploads. Phones send JPEG from the file picker. */
export const GalleryUploadMimeType = Schema.Literals(["image/jpeg", "image/png", "image/webp"]);

/** Type and size of an upload, checked in the browser before sending and again on the server. */
export const GalleryUploadFile = Schema.Struct({
  type: GalleryUploadMimeType,
  size: Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: GALLERY_UPLOAD_MAX_BYTES })),
});

/**
 * The multipart body of one upload: the image in the `photo` field, and the part of the gallery
 * it goes to in the `section` field.
 */
export const GalleryUploadFormData = Schema.instanceOf(FormData).pipe(
  Schema.check(
    Schema.makeFilter(
      (data) => {
        const photo = data.get("photo");

        return (
          photo instanceof File &&
          Schema.is(GalleryUploadFile)({ type: photo.type, size: photo.size })
        );
      },
      { message: `Upload a JPG, PNG, or WebP image up to ${GALLERY_UPLOAD_MAX_MEGABYTES} MB` },
    ),
    Schema.makeFilter((data) => Schema.is(GallerySection)(data.get("section")), {
      message: "Choose the part of the gallery for the photo",
    }),
  ),
);

/** A gallery photo ID (a UUID). */
export const GalleryPhotoId = Schema.String.check(Schema.isUUID());

/** Optional text about a photo. An empty string clears it. */
const PhotoDetail = Schema.Trim.check(Schema.isMaxLength(DETAIL_MAX_LENGTH));

/**
 * The kinds of gallery filter: a `theme`, such as anime or dark fantasy, and a `series`, such as
 * Berserk or Naruto. A work photo has any number of themes and at most one series.
 */
export const GALLERY_TAG_KINDS = ["theme", "series"] as const;

/** One kind of gallery filter. */
export const GalleryTagKind = Schema.Literals(GALLERY_TAG_KINDS);

/** A theme or series ID (a UUID). */
export const GalleryTagId = Schema.String.check(Schema.isUUID());

/**
 * The name of a theme or series, and its name in each site language. A translation may be empty:
 * visitors in that language then see `name`. Names such as "Naruto" need no translation.
 */
export const GalleryTagNames = Schema.Struct({
  name: requiredText("Name", TAG_NAME_MAX_LENGTH),
  translations: Schema.Record(SiteLocale, optionalText("Translation", TAG_NAME_MAX_LENGTH)),
});

/** Adds a theme or series at the end of its list. */
export const CreateGalleryTagInput = Schema.Struct({
  kind: GalleryTagKind,
  ...GalleryTagNames.fields,
});

/** Renames a theme or series. */
export const UpdateGalleryTagInput = Schema.Struct({
  id: GalleryTagId,
  ...GalleryTagNames.fields,
});

/** Selects one theme or series. */
export const GalleryTagIdInput = Schema.Struct({
  id: GalleryTagId,
});

/**
 * The new order of the themes or of the series, first first. It must list every one of that kind
 * exactly once, so an order made from a stale list cannot drop one.
 */
export const ReorderGalleryTagsInput = Schema.Struct({
  kind: GalleryTagKind,
  ids: distinctTagIds("theme or series"),
});

/** The descriptive details of a photo, its series, and its themes. */
export const UpdateGalleryPhotoInput = Schema.Struct({
  id: GalleryPhotoId,
  title: PhotoDetail,
  placement: PhotoDetail,
  seriesId: Schema.NullOr(GalleryTagId),
  themeIds: distinctTagIds("theme"),
});

/** Whether a photo is on the home page and whether visitors can see it. */
export const SetGalleryPhotoFlagsInput = Schema.Struct({
  id: GalleryPhotoId,
  featured: Schema.Boolean,
  hidden: Schema.Boolean,
});

/** Deletes one photo and its stored files. */
export const DeleteGalleryPhotoInput = Schema.Struct({
  id: GalleryPhotoId,
});

/**
 * The new order of one part of the gallery, first photo first. It must list every photo of that
 * part exactly once, so a reorder made from a stale list cannot drop or duplicate a photo.
 */
export const ReorderGalleryInput = Schema.Struct({
  section: GallerySection,
  ids: Schema.Array(GalleryPhotoId).check(
    Schema.isMaxLength(REORDER_MAX_PHOTOS),
    Schema.makeFilter((ids) => new Set(ids).size === ids.length || "Each photo may appear once"),
  ),
});

/** One part of the gallery. */
export type GallerySection = typeof GallerySection.Type;

/** Decoded photo details. */
export type UpdateGalleryPhotoInput = typeof UpdateGalleryPhotoInput.Type;

/** One kind of gallery filter: a theme or a series. */
export type GalleryTagKind = typeof GalleryTagKind.Type;

/** Decoded names of a theme or series. */
export type GalleryTagNames = typeof GalleryTagNames.Type;

/** Decoded input for a new theme or series. */
export type CreateGalleryTagInput = typeof CreateGalleryTagInput.Type;

/** Decoded input for renaming a theme or series. */
export type UpdateGalleryTagInput = typeof UpdateGalleryTagInput.Type;

/** Decoded photo flags. */
export type SetGalleryPhotoFlagsInput = typeof SetGalleryPhotoFlagsInput.Type;

/** An accepted upload image type. */
export type GalleryUploadMimeType = typeof GalleryUploadMimeType.Type;
