import type { getGallery } from "@/server/gallery/gallery.functions";

import { photoUrl } from "./photo-files";

/** A photo's caption: its title, or the series when there is no title. */
function Caption({ photo }: { photo: GalleryPhoto }) {
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
 * tall. Each photo opens its full-size image.
 */
export function GalleryGrid({ photos }: { photos: ReadonlyArray<GalleryPhoto> }) {
  return (
    <div className="gallery-grid">
      {photos.map((photo) => (
        <figure className="gallery-item" key={photo.id} data-featured={photo.featured}>
          <a href={photoUrl(photo.storageKey, "large")} target="_blank" rel="noreferrer">
            <img
              src={photoUrl(photo.storageKey, "thumb")}
              srcSet={`${photoUrl(photo.storageKey, "thumb")} 720w, ${photoUrl(photo.storageKey, "large")} 2000w`}
              sizes="(max-width: 900px) 50vw, 30vw"
              width={photo.width}
              height={photo.height}
              alt={photo.title ?? "Tattoo by Daniel Castro"}
              loading="lazy"
              decoding="async"
            />
          </a>
          <Caption photo={photo} />
        </figure>
      ))}
    </div>
  );
}

type GalleryPhoto = Awaited<ReturnType<typeof getGallery>>[number];
