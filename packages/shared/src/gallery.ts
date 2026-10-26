import { Schema } from "effect";

/** Longest title, series, or placement text on a gallery photo. */
const DETAIL_MAX_LENGTH = 120;

/** Most photos one reorder request may list. */
const REORDER_MAX_PHOTOS = 2000;

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

/** The multipart body of one upload: the image in the `photo` field. */
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
  ),
);

/** A gallery photo ID (a UUID). */
export const GalleryPhotoId = Schema.String.check(Schema.isUUID());

/** Optional text about a photo. An empty string clears it. */
const PhotoDetail = Schema.Trim.check(Schema.isMaxLength(DETAIL_MAX_LENGTH));

/** The descriptive details of a photo. */
export const UpdateGalleryPhotoInput = Schema.Struct({
  id: GalleryPhotoId,
  title: PhotoDetail,
  series: PhotoDetail,
  placement: PhotoDetail,
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
 * The new order of the whole gallery, first photo first. It must list every photo exactly once,
 * so a reorder made from a stale list cannot drop or duplicate a photo.
 */
export const ReorderGalleryInput = Schema.Struct({
  ids: Schema.Array(GalleryPhotoId).check(
    Schema.isMaxLength(REORDER_MAX_PHOTOS),
    Schema.makeFilter((ids) => new Set(ids).size === ids.length || "Each photo may appear once"),
  ),
});

/** Decoded photo details. */
export type UpdateGalleryPhotoInput = typeof UpdateGalleryPhotoInput.Type;

/** Decoded photo flags. */
export type SetGalleryPhotoFlagsInput = typeof SetGalleryPhotoFlagsInput.Type;

/** An accepted upload image type. */
export type GalleryUploadMimeType = typeof GalleryUploadMimeType.Type;
