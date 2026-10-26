import { queryOptions } from "@tanstack/react-query";

import { getAdminGallery, getGallery } from "@/server/gallery/gallery.functions";

/** Query keys for gallery data. Invalidate `all` after any change to the gallery. */
export const galleryQueryKeys = {
  all: ["gallery"] as const,
  public: ["gallery", "public"] as const,
  admin: ["gallery", "admin"] as const,
};

/** The gallery as visitors see it. */
export const galleryQueryOptions = queryOptions({
  queryKey: galleryQueryKeys.public,
  queryFn: () => getGallery(),
});

/** Every photo, hidden ones included, for the admin area. */
export const adminGalleryQueryOptions = queryOptions({
  queryKey: galleryQueryKeys.admin,
  queryFn: () => getAdminGallery(),
});
