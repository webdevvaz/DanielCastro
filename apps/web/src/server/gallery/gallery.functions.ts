import { listAllGalleryPhotos, listGalleryTags, listPublicGalleryPhotos } from "@daniel/db";
import {
  CreateGalleryTagInput,
  DeleteGalleryPhotoInput,
  GallerySectionInput,
  GalleryTagIdInput,
  GalleryUploadFormData,
  ReorderGalleryInput,
  ReorderGalleryTagsInput,
  SetGalleryPhotoFlagsInput,
  UpdateGalleryPhotoInput,
  UpdateGalleryTagInput,
} from "@daniel/shared/gallery";
import { createServerFn } from "@tanstack/react-start";

import { adminMiddleware } from "../auth/auth.middleware";
import { runServerEffect } from "../run.server";
import { validateInput } from "../validate-input";
import {
  createGalleryTag as createGalleryTagEffect,
  removeGalleryTag,
  renameGalleryTag,
  reorderTags,
} from "./gallery-tags.server";
import {
  changeGalleryPhotoFlags,
  removeGalleryPhoto,
  reorderGallery as reorderGalleryEffect,
  updateGalleryPhoto as updateGalleryPhotoEffect,
  uploadGalleryPhoto as uploadGalleryPhotoEffect,
} from "./gallery.server";

/** One section of the gallery as visitors see it: the work, or the studio photos. Public. */
export const getGallery = createServerFn({ method: "GET" })
  .validator(validateInput(GallerySectionInput))
  .handler(({ data }) => runServerEffect(listPublicGalleryPhotos(data.section)));

/** Every photo of every section, hidden ones included, for the admin area. */
export const getAdminGallery = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(() => runServerEffect(listAllGalleryPhotos()));

/** Accepts multipart form data with one image in `photo` and its section in `section`. */
export const uploadGalleryPhoto = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(validateInput(GalleryUploadFormData))
  .handler(({ context, data }) => runServerEffect(uploadGalleryPhotoEffect(context.user.id, data)));

/** Saves the details of a photo. */
export const updateGalleryPhoto = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(validateInput(UpdateGalleryPhotoInput))
  .handler(({ context, data }) => runServerEffect(updateGalleryPhotoEffect(context.user.id, data)));

/** Sets whether a photo is featured and whether it is hidden. */
export const setGalleryPhotoFlags = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(validateInput(SetGalleryPhotoFlagsInput))
  .handler(({ context, data }) => runServerEffect(changeGalleryPhotoFlags(context.user.id, data)));

/** Deletes a photo. */
export const deleteGalleryPhoto = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(validateInput(DeleteGalleryPhotoInput))
  .handler(({ context, data }) => runServerEffect(removeGalleryPhoto(context.user.id, data.id)));

/** Puts one section of the gallery in a new order. */
export const reorderGallery = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(validateInput(ReorderGalleryInput))
  .handler(({ context, data }) =>
    runServerEffect(reorderGalleryEffect(context.user.id, data.section, data.ids)),
  );

/** The themes and series that visitors filter the work by, in list order. Public. */
export const getGalleryTags = createServerFn({ method: "GET" }).handler(() =>
  runServerEffect(listGalleryTags()),
);

/** Adds a theme or series at the end of its list. */
export const createGalleryTag = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(validateInput(CreateGalleryTagInput))
  .handler(({ context, data }) => runServerEffect(createGalleryTagEffect(context.user.id, data)));

/** Renames a theme or series, or changes its translations. */
export const updateGalleryTag = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(validateInput(UpdateGalleryTagInput))
  .handler(({ context, data }) => runServerEffect(renameGalleryTag(context.user.id, data)));

/** Deletes a theme or series. */
export const deleteGalleryTag = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(validateInput(GalleryTagIdInput))
  .handler(({ context, data }) => runServerEffect(removeGalleryTag(context.user.id, data.id)));

/** Puts the themes, or the series, in a new order. */
export const reorderGalleryTags = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(validateInput(ReorderGalleryTagsInput))
  .handler(({ context, data }) =>
    runServerEffect(reorderTags(context.user.id, data.kind, data.ids)),
  );
