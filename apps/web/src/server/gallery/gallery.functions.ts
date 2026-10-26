import { listAllGalleryPhotos, listPublicGalleryPhotos } from "@daniel/db";
import {
  DeleteGalleryPhotoInput,
  GalleryUploadFormData,
  ReorderGalleryInput,
  SetGalleryPhotoFlagsInput,
  UpdateGalleryPhotoInput,
} from "@daniel/shared/gallery";
import { createServerFn } from "@tanstack/react-start";

import { adminMiddleware } from "../auth/auth.middleware";
import { runServerEffect } from "../run.server";
import { validateInput } from "../validate-input";
import {
  changeGalleryPhotoFlags,
  removeGalleryPhoto,
  reorderGallery as reorderGalleryEffect,
  updateGalleryPhoto as updateGalleryPhotoEffect,
  uploadGalleryPhoto as uploadGalleryPhotoEffect,
} from "./gallery.server";

/** The gallery as visitors see it. Public. */
export const getGallery = createServerFn({ method: "GET" }).handler(() =>
  runServerEffect(listPublicGalleryPhotos()),
);

/** Every photo, hidden ones included, for the admin area. */
export const getAdminGallery = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(() => runServerEffect(listAllGalleryPhotos()));

/** Accepts multipart form data with one image in the `photo` field. */
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

/** Puts the whole gallery in a new order. */
export const reorderGallery = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(validateInput(ReorderGalleryInput))
  .handler(({ context, data }) => runServerEffect(reorderGalleryEffect(context.user.id, data.ids)));
