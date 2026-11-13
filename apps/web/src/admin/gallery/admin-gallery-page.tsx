import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

import { AdminPhotoGrid } from "./admin-photo-grid";
import { PhotoUploader } from "./photo-uploader";

/** The parts of the gallery, each managed on its own: its photos, uploads, and order. */
const SECTIONS = [
  {
    section: "work",
    title: "Work",
    description:
      "Daniel's tattoos, on the Work page in this order. Featured photos show as large tiles.",
  },
  {
    section: "studio",
    title: "Studio",
    description:
      "Photos of the studio, on the About page in this order. The first photo shows large.",
  },
] as const;

const countLabel = (count: number) => `${count} ${count === 1 ? "photo" : "photos"}`;

/** Manages the gallery: upload, order, feature, hide, describe, and delete photos, per section. */
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
        Drag photos to change their order, or use the arrows. Hidden photos stay here only. A click
        on a photo on the site shows it large, with its title and details.
      </p>
      {SECTIONS.map((item) => {
        const sectionPhotos = photos.filter((photo) => photo.section === item.section);

        return (
          <section className="admin-section" key={item.section}>
            <h2>
              {item.title} <small>{countLabel(sectionPhotos.length)}</small>
            </h2>
            <p className="muted">{item.description}</p>
            <PhotoUploader section={item.section} />
            <AdminPhotoGrid section={item.section} photos={sectionPhotos} />
          </section>
        );
      })}
    </>
  );
}
