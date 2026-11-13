import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useState } from "react";

import { photoUrl } from "@/gallery/photo-files";
import { PhotoViewer } from "@/gallery/photo-viewer";

const FALLBACK_ALT = "Daniel Castro Tattoo Studio in Braga";

/**
 * The studio photos from the gallery's Studio section, in their admin order: the first one large,
 * the others in a row below. A click shows a photo at full size. Nothing shows without photos.
 */
export function StudioPhotos() {
  const context = useRouteContext({ from: "/_site/about" });

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const { data: photos } = useSuspenseQuery(context.studioPhotosQueryOptions);

  if (photos.length === 0) return null;

  return (
    <section>
      <h2 className="page-subtitle">The studio</h2>
      <p className="muted">Braga, Portugal · By appointment only</p>
      <div className="studio-photos">
        {photos.map((photo, index) => (
          <button
            className="photo-open"
            key={photo.id}
            type="button"
            aria-label={`View ${photo.title ?? "studio photo"} at full size`}
            onClick={() => setOpenIndex(index)}
          >
            <img
              src={photoUrl(photo.storageKey, index === 0 ? "large" : "thumb")}
              width={photo.width}
              height={photo.height}
              alt={photo.title ?? FALLBACK_ALT}
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
          fallbackAlt={FALLBACK_ALT}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </section>
  );
}
