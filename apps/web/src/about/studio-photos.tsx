import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useState } from "react";

import { photoUrl } from "@/gallery/photo-files";
import { PhotoViewer } from "@/gallery/photo-viewer";
import { useSiteMessages } from "@/i18n/site-messages";
import { useLocale } from "@/i18n/use-locale";

import { ABOUT_PAGE_TEXT } from "./about-page-text";

/**
 * The studio photos from the gallery's Studio section, in their admin order: the first one large,
 * the others in a row below. A click shows a photo at full size. Nothing shows without photos.
 */
export function StudioPhotos() {
  const context = useRouteContext({ from: "/{-$locale}/_site/about" });

  const site = useSiteMessages();
  const t = ABOUT_PAGE_TEXT[useLocale()];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const { data: photos } = useSuspenseQuery(context.studioPhotosQueryOptions);

  if (photos.length === 0) return null;

  return (
    <section>
      <h2 className="page-subtitle">{t.studioTitle}</h2>
      <p className="muted">
        {t.studioCity} · {site.contact.byAppointment}
      </p>
      <div className="studio-photos">
        {photos.map((photo, index) => (
          <button
            className="photo-open"
            key={photo.id}
            type="button"
            aria-label={site.viewer.open(photo.title)}
            onClick={() => setOpenIndex(index)}
          >
            <img
              src={photoUrl(photo.storageKey, index === 0 ? "large" : "thumb")}
              width={photo.width}
              height={photo.height}
              alt={photo.title ?? site.studioAlt}
              loading="lazy"
              decoding="async"
            />
          </button>
        ))}
      </div>
      {openIndex === null ? null : (
        <PhotoViewer
          photos={photos}
          index={openIndex}
          fallbackAlt={site.studioAlt}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </section>
  );
}
