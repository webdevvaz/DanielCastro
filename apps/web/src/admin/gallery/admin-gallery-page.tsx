import { GALLERY_SECTIONS } from "@daniel/shared/gallery";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

import { useAdminText } from "../use-admin-text";
import { AdminPhotoGrid } from "./admin-photo-grid";
import { PhotoUploader } from "./photo-uploader";

/** Manages the gallery: upload, order, feature, hide, describe, and delete photos, per section. */
export function AdminGalleryPage() {
  const context = useRouteContext({ from: "/admin/_dashboard/gallery" });

  const { t } = useAdminText();

  const { data: photos } = useSuspenseQuery(context.adminGalleryQueryOptions);

  return (
    <>
      <p className="eyebrow">
        <b>{t.nav.label}</b> {t.gallery.title}
      </p>
      <h1>{t.gallery.title}</h1>
      <p className="lead">{t.gallery.lead}</p>
      {GALLERY_SECTIONS.map((section) => {
        const sectionPhotos = photos.filter((photo) => photo.section === section);
        const text = t.gallery.sections[section];

        return (
          <section className="admin-section" key={section}>
            <h2>
              {text.title} <small>{t.gallery.count(sectionPhotos.length)}</small>
            </h2>
            <p className="muted">{text.description}</p>
            <PhotoUploader section={section} />
            <AdminPhotoGrid section={section} photos={sectionPhotos} />
          </section>
        );
      })}
    </>
  );
}
