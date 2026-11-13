import { queryOptions } from "@tanstack/react-query";

import { getAdminGallery, getGallery } from "@/server/gallery/gallery.functions";

/** Query keys for gallery data. Invalidate `all` after any change to the gallery. */
export const galleryQueryKeys = {
  all: ["gallery"] as const,
  work: ["gallery", "public", "work"] as const,
  studio: ["gallery", "public", "studio"] as const,
  admin: ["gallery", "admin"] as const,
};

/** Daniel's work as visitors see it: the Work page. */
export const galleryQueryOptions = queryOptions({
  queryKey: galleryQueryKeys.work,
  queryFn: () => getGallery({ data: { section: "work" } }),
});

/** The studio photos as visitors see them: the About page. */
export const studioPhotosQueryOptions = queryOptions({
  queryKey: galleryQueryKeys.studio,
  queryFn: () => getGallery({ data: { section: "studio" } }),
});

/** Every photo of every section, hidden ones included, for the admin area. */
export const adminGalleryQueryOptions = queryOptions({
  queryKey: galleryQueryKeys.admin,
  queryFn: () => getAdminGallery(),
});
