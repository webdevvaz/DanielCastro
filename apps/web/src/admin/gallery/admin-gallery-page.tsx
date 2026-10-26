import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

import { AdminPhotoGrid } from "./admin-photo-grid";
import { PhotoUploader } from "./photo-uploader";

/** Manages the gallery: upload, order, feature, hide, describe, and delete photos. */
export function AdminGalleryPage() {
  const context = useRouteContext({ from: "/admin/_dashboard/gallery" });

  const { data: photos } = useSuspenseQuery(context.adminGalleryQueryOptions);

  return (
    <>
      <p className="eyebrow">
        <b>Admin</b> Gallery
      </p>
      <h1>Gallery</h1>
      <p className="lead">
        Drag photos to change their order, or use the arrows. The Work page shows the photos in the
        same order; featured photos show as large tiles, and hidden photos stay here only.
      </p>
      <section className="admin-section">
        <PhotoUploader />
      </section>
      <section className="admin-section">
        <h2>
          {photos.length} {photos.length === 1 ? "photo" : "photos"}
        </h2>
        <AdminPhotoGrid photos={photos} />
      </section>
    </>
  );
}
