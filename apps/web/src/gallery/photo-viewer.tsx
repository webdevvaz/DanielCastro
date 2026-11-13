import { useEffect, useRef } from "react";

import type { getGallery } from "@/server/gallery/gallery.functions";

import { useSiteMessages } from "@/i18n/site-messages";

import { photoUrl } from "./photo-files";

/** The photo's title, then its series and placement. Empty for a photo without details. */
function PhotoDetails({ photo }: { photo: ViewerPhoto }) {
  const extra = [photo.series, photo.placement].filter(Boolean).join(" · ");

  return (
    <>
      {photo.title ? <b>{photo.title}</b> : null}
      {extra === "" ? null : <span>{extra}</span>}
    </>
  );
}

/**
 * One photo at full size over the page, with its details underneath. The arrows, or the arrow
 * keys, show the previous and next photo. Escape, the close button, or a click beside the photo
 * closes it. The thumbnail, already loaded by the grid, shows until the large file arrives.
 */
export function PhotoViewer({ photos, index, fallbackAlt, onIndexChange, onClose }: Props) {
  const t = useSiteMessages();

  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog !== null && !dialog.open) dialog.showModal();
  }, []);

  const photo = photos.at(index);

  if (photo === undefined) return null;

  const hasPrevious = index > 0;
  const hasNext = index < photos.length - 1;

  const close = () => dialogRef.current?.close();

  const show = (target: number) => {
    if (target >= 0 && target < photos.length) onIndexChange(target);
  };

  return (
    <dialog
      ref={dialogRef}
      className="photo-viewer"
      aria-label={photo.title ?? fallbackAlt}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") show(index - 1);

        if (event.key === "ArrowRight") show(index + 1);
      }}
    >
      <figure className="photo-viewer-figure">
        <img
          key={photo.id}
          src={photoUrl(photo.storageKey, "large")}
          width={photo.width}
          height={photo.height}
          alt={photo.title ?? fallbackAlt}
          style={{ backgroundImage: `url(${photoUrl(photo.storageKey, "thumb")})` }}
        />
        <figcaption>
          <PhotoDetails photo={photo} />
          <small>
            {index + 1} / {photos.length}
          </small>
        </figcaption>
      </figure>
      <button
        className="photo-viewer-close"
        type="button"
        aria-label={t.viewer.close}
        onClick={close}
      >
        ×
      </button>
      {photos.length > 1 ? (
        <>
          <button
            className="photo-viewer-step"
            data-direction="previous"
            type="button"
            aria-label={t.viewer.previous}
            disabled={!hasPrevious}
            onClick={() => show(index - 1)}
          >
            ←
          </button>
          <button
            className="photo-viewer-step"
            data-direction="next"
            type="button"
            aria-label={t.viewer.next}
            disabled={!hasNext}
            onClick={() => show(index + 1)}
          >
            →
          </button>
        </>
      ) : null}
    </dialog>
  );
}

type Props = {
  readonly photos: ReadonlyArray<ViewerPhoto>;
  readonly index: number;
  /** The image description when a photo has no title. */
  readonly fallbackAlt: string;
  readonly onIndexChange: (index: number) => void;
  readonly onClose: () => void;
};

/** A gallery photo as visitors receive it. */
export type ViewerPhoto = Awaited<ReturnType<typeof getGallery>>[number];
