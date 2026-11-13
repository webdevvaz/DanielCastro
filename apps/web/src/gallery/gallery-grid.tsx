import { useState } from "react";

import { photoUrl } from "./photo-files";
import { PhotoViewer, type ViewerPhoto } from "./photo-viewer";

const FALLBACK_ALT = "Tattoo by Daniel Castro";

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
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div className="gallery-grid">
        {photos.map((photo, index) => (
          <figure className="gallery-item" key={photo.id} data-featured={photo.featured}>
            <button
              className="photo-open"
              type="button"
              aria-label={`View ${photo.title ?? "photo"} at full size`}
              onClick={() => setOpenIndex(index)}
            >
              <img
                src={photoUrl(photo.storageKey, "thumb")}
                srcSet={`${photoUrl(photo.storageKey, "thumb")} 720w, ${photoUrl(photo.storageKey, "large")} 2000w`}
                sizes="(max-width: 900px) 50vw, 30vw"
                width={photo.width}
                height={photo.height}
                alt={photo.title ?? FALLBACK_ALT}
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
          fallbackAlt={FALLBACK_ALT}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}
