import { useMutation } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { galleryQueryKeys } from "@/integrations/tanstack-query/gallery-query-options";
import { reorderGallery } from "@/server/gallery/gallery.functions";

import { AdminPhotoCard, type AdminGalleryPhoto } from "./admin-photo-card";

/** Drag type of a gallery card, so dropped files are not taken for a reorder. */
const CARD_DRAG_TYPE = "application/x-gallery-photo";

/** The order with `id` moved to `target`, counted in the order without it. */
function moveTo(order: ReadonlyArray<string>, id: string, target: number) {
  const others = order.filter((other) => other !== id);
  const index = Math.max(0, Math.min(target, others.length));

  return [...others.slice(0, index), id, ...others.slice(index)];
}

const sameOrder = (left: ReadonlyArray<string>, right: ReadonlyArray<string>) =>
  left.length === right.length && left.every((id, index) => right[index] === id);

/**
 * Every photo of the gallery in order. Dragging a card moves it live; dropping saves the whole
 * new order. While the save runs, the new order stays on screen and reordering is paused.
 */
export function AdminPhotoGrid({ photos }: { photos: ReadonlyArray<AdminGalleryPhoto> }) {
  const { queryClient } = useRouteContext({ from: "/admin/_dashboard/gallery" });

  const [draftOrder, setDraftOrder] = useState<ReadonlyArray<string> | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const reorder = useServerFn(reorderGallery);

  const reorderMutation = useMutation({
    mutationFn: (ids: ReadonlyArray<string>) => reorder({ data: { ids: [...ids] } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: galleryQueryKeys.all });
    },
    onError: (error) => {
      toast.error(error.message || "The new order could not be saved");
    },
    onSettled: () => {
      setDraftOrder(null);
    },
  });

  const savedOrder = photos.map((photo) => photo.id);
  const order = draftOrder ?? savedOrder;
  const photosById = new Map(photos.map((photo) => [photo.id, photo]));

  const orderedPhotos = order.flatMap((id) => {
    const photo = photosById.get(id);

    return photo === undefined ? [] : [photo];
  });

  const save = (ids: ReadonlyArray<string>) => {
    if (sameOrder(ids, savedOrder)) {
      setDraftOrder(null);

      return;
    }

    setDraftOrder(ids);
    reorderMutation.mutate(ids);
  };

  if (photos.length === 0) {
    return <p className="empty-state">No photos yet. Add the first ones above.</p>;
  }

  return (
    <div className="admin-photos">
      {orderedPhotos.map((photo, index) => (
        <AdminPhotoCard
          key={photo.id}
          photo={photo}
          position={index + 1}
          dragging={draggedId === photo.id}
          reorderDisabled={reorderMutation.isPending}
          isFirst={index === 0}
          isLast={index === orderedPhotos.length - 1}
          onMove={(offset) => save(moveTo(order, photo.id, index + offset))}
          dragHandlers={{
            onDragStart: (event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData(CARD_DRAG_TYPE, photo.id);

              setDraggedId(photo.id);
              setDraftOrder(order);
            },
            onDragEnter: () => {
              if (draggedId === null || draggedId === photo.id) return;

              setDraftOrder(moveTo(order, draggedId, index));
            },
            onDragOver: (event) => {
              if (event.dataTransfer.types.includes(CARD_DRAG_TYPE)) event.preventDefault();
            },
            onDragEnd: () => {
              setDraggedId(null);
              save(order);
            },
          }}
        />
      ))}
    </div>
  );
}
