import type { DragEvent } from "react";

import { useMutation } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import type { getAdminGallery } from "@/server/gallery/gallery.functions";

import { photoUrl } from "@/gallery/photo-files";
import { galleryQueryKeys } from "@/integrations/tanstack-query/gallery-query-options";
import { deleteGalleryPhoto, setGalleryPhotoFlags } from "@/server/gallery/gallery.functions";

import { useAdminText } from "../use-admin-text";
import { PhotoDetailsForm } from "./photo-details-form";

/**
 * One photo in the admin gallery: drag it to reorder, or use the arrows. Feature a work photo as a
 * large tile on the Work page, hide it from visitors, edit its details, or delete it.
 */
export function AdminPhotoCard({
  photo,
  position,
  dragging,
  reorderDisabled,
  isFirst,
  isLast,
  onMove,
  dragHandlers,
}: AdminPhotoCardProps) {
  const { queryClient } = useRouteContext({ from: "/admin/_dashboard/gallery" });

  const { t } = useAdminText();

  const [editing, setEditing] = useState(false);

  const setFlags = useServerFn(setGalleryPhotoFlags);
  const deletePhoto = useServerFn(deleteGalleryPhoto);

  const refreshGallery = () => queryClient.invalidateQueries({ queryKey: galleryQueryKeys.all });

  const flagsMutation = useMutation({
    mutationFn: (flags: { featured: boolean; hidden: boolean }) =>
      setFlags({ data: { id: photo.id, ...flags } }),
    onSuccess: refreshGallery,
    onError: (error) => toast.error(error.message || t.gallery.card.changeFailed),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePhoto({ data: { id: photo.id } }),
    onSuccess: refreshGallery,
    onError: (error) => toast.error(error.message || t.gallery.card.deleteFailed),
  });

  const busy = flagsMutation.isPending || deleteMutation.isPending;

  return (
    <article
      className="admin-photo"
      data-dragging={dragging}
      data-hidden={photo.hidden}
      draggable={!reorderDisabled && !editing}
      onDragStart={dragHandlers.onDragStart}
      onDragEnter={dragHandlers.onDragEnter}
      onDragOver={dragHandlers.onDragOver}
      onDragEnd={dragHandlers.onDragEnd}
      onDrop={(event) => event.preventDefault()}
    >
      <div className="admin-photo-image">
        <img
          src={photoUrl(photo.storageKey, "thumb")}
          alt={photo.title ?? t.gallery.card.photoAlt(position)}
          width={photo.width}
          height={photo.height}
          draggable={false}
        />
        <div className="admin-photo-badges">
          <span>#{position}</span>
          {photo.featured ? <span data-kind="featured">{t.gallery.card.featured}</span> : null}
          {photo.hidden ? <span>{t.gallery.card.hidden}</span> : null}
        </div>
      </div>
      <div className="admin-photo-body">
        {editing ? (
          <PhotoDetailsForm photo={photo} onClose={() => setEditing(false)} />
        ) : (
          <>
            <p className="admin-photo-title">
              {photo.title ?? t.gallery.card.noTitle}
              <small>
                {[photo.series, photo.placement].filter(Boolean).join(" · ") ||
                  t.gallery.card.noDetails}
              </small>
            </p>
            <div className="admin-photo-actions">
              <button
                className="btn btn-ghost btn-small"
                type="button"
                onClick={() => setEditing(true)}
              >
                {t.common.edit}
              </button>
              {photo.section === "work" ? (
                <button
                  className="btn btn-ghost btn-small"
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    flagsMutation.mutate({ featured: !photo.featured, hidden: photo.hidden })
                  }
                >
                  {photo.featured ? t.gallery.card.unfeature : t.gallery.card.feature}
                </button>
              ) : null}
              <button
                className="btn btn-ghost btn-small"
                type="button"
                disabled={busy}
                onClick={() =>
                  flagsMutation.mutate({ featured: photo.featured, hidden: !photo.hidden })
                }
              >
                {photo.hidden ? t.gallery.card.show : t.gallery.card.hide}
              </button>
            </div>
            <div className="admin-photo-actions">
              <button
                className="btn btn-ghost btn-small"
                type="button"
                aria-label={t.gallery.card.moveEarlier}
                disabled={reorderDisabled || isFirst}
                onClick={() => onMove(-1)}
              >
                ←
              </button>
              <button
                className="btn btn-ghost btn-small"
                type="button"
                aria-label={t.gallery.card.moveLater}
                disabled={reorderDisabled || isLast}
                onClick={() => onMove(1)}
              >
                →
              </button>
              <button
                className="btn btn-danger btn-small"
                type="button"
                disabled={busy}
                onClick={() => {
                  if (window.confirm(t.gallery.card.confirmDelete)) {
                    deleteMutation.mutate();
                  }
                }}
              >
                {t.common.delete}
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

type AdminPhotoCardProps = {
  readonly photo: AdminGalleryPhoto;
  readonly position: number;
  readonly dragging: boolean;
  readonly reorderDisabled: boolean;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly onMove: (offset: number) => void;
  readonly dragHandlers: {
    readonly onDragStart: (event: DragEvent<HTMLElement>) => void;
    readonly onDragEnter: () => void;
    readonly onDragOver: (event: DragEvent<HTMLElement>) => void;
    readonly onDragEnd: () => void;
  };
};

/** A photo as the admin gallery lists it. */
export type AdminGalleryPhoto = Awaited<ReturnType<typeof getAdminGallery>>[number];
