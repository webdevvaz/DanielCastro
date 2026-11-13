import { useState } from "react";

import { useSiteMessages } from "@/i18n/site-messages";

import { photoUrl } from "./photo-files";
import { PhotoViewer, type ViewerPhoto } from "./photo-viewer";

/** A photo's caption: its title, or the series when there is no title. */
function Caption({ photo }: { photo: ViewerPhoto }) {
  if (!photo.title && !photo.series) return null;

  return (
    <figcaption>
      {photo.title ? <b>{photo.title}</b> : null}
      {[photo.series, photo.placement].filter(Boolean).join(" · ")}
    </figcaption>
  );
}

/**
 * Gallery photos in a grid of even tiles, in gallery order. Featured photos take a tile twice as
 * tall. A click on a photo shows it at full size on the same page, with its details.
 */
export function GalleryGrid({ photos }: { photos: ReadonlyArray<ViewerPhoto> }) {
  const t = useSiteMessages();

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div className="gallery-grid">
        {photos.map((photo, index) => (
          <figure className="gallery-item" key={photo.id} data-featured={photo.featured}>
            <button
              className="photo-open"
              type="button"
              aria-label={t.viewer.open(photo.title)}
              onClick={() => setOpenIndex(index)}
            >
              <img
                src={photoUrl(photo.storageKey, "thumb")}
                srcSet={`${photoUrl(photo.storageKey, "thumb")} 720w, ${photoUrl(photo.storageKey, "large")} 2000w`}
                sizes="(max-width: 900px) 50vw, 30vw"
                width={photo.width}
                height={photo.height}
                alt={photo.title ?? t.tattooAlt}
                loading="lazy"
                decoding="async"
              />
            </button>
            <Caption photo={photo} />
          </figure>
        ))}
      </div>
      {openIndex === null ? null : (
        <PhotoViewer
          photos={photos}
          index={openIndex}
          fallbackAlt={t.tattooAlt}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}
