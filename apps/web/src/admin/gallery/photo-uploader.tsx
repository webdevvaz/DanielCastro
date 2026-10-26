import { GALLERY_UPLOAD_MAX_MEGABYTES, GalleryUploadFile } from "@daniel/shared/gallery";
import { useMutation } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Schema } from "effect";
import { useId, useState } from "react";

import { galleryQueryKeys } from "@/integrations/tanstack-query/gallery-query-options";
import { uploadGalleryPhoto } from "@/server/gallery/gallery.functions";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";

const isAcceptedFile = Schema.is(GalleryUploadFile);

const STATUS_LABELS = {
  waiting: "Waiting",
  uploading: "Uploading…",
  failed: "Failed",
} as const;

/**
 * Uploads photos to the gallery: drop them on the area or pick them, from a phone or a computer.
 * Files upload one at a time; finished files leave the list, failed ones stay with the reason.
 */
export function PhotoUploader() {
  const { queryClient } = useRouteContext({ from: "/admin/_dashboard/gallery" });
  const inputId = useId();

  const [uploads, setUploads] = useState<ReadonlyArray<UploadItem>>([]);
  const [dragActive, setDragActive] = useState(false);

  const upload = useServerFn(uploadGalleryPhoto);

  const setStatus = (id: string, status: UploadStatus, error?: string) => {
    setUploads((items) =>
      items.map((item) => (item.id === id ? { ...item, status, error } : item)),
    );
  };

  const uploadMutation = useMutation({
    mutationFn: async (items: ReadonlyArray<UploadItem>) => {
      for (const item of items) {
        if (!isAcceptedFile({ type: item.file.type, size: item.file.size })) {
          setStatus(
            item.id,
            "failed",
            `Use a JPG, PNG, or WebP image up to ${GALLERY_UPLOAD_MAX_MEGABYTES} MB`,
          );

          continue;
        }

        setStatus(item.id, "uploading");

        const formData = new FormData();

        formData.append("photo", item.file);

        try {
          await upload({ data: formData });

          setUploads((current) => current.filter((entry) => entry.id !== item.id));
        } catch (error) {
          setStatus(item.id, "failed", error instanceof Error ? error.message : "Upload failed");
        }
      }

      await queryClient.invalidateQueries({ queryKey: galleryQueryKeys.all });
    },
  });

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const items = Array.from(files, (file) => ({
      id: crypto.randomUUID(),
      file,
      status: "waiting" as const,
    }));

    setUploads((current) => [...current.filter((item) => item.status === "failed"), ...items]);
    uploadMutation.mutate(items);
  };

  return (
    <div>
      <label
        className="dropzone"
        htmlFor={inputId}
        data-active={dragActive}
        onDragOver={(event) => {
          if (!event.dataTransfer.types.includes("Files")) return;

          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          if (!event.dataTransfer.types.includes("Files")) return;

          event.preventDefault();
          setDragActive(false);
          addFiles(event.dataTransfer.files);
        }}
      >
        <strong>{uploadMutation.isPending ? "Uploading…" : "Add photos"}</strong>
        <span>
          Drop photos here, or click to choose them. JPG, PNG, or WebP up to{" "}
          {GALLERY_UPLOAD_MAX_MEGABYTES} MB each. New photos go first.
        </span>
        <input
          className="visually-hidden"
          id={inputId}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          disabled={uploadMutation.isPending}
          onChange={(event) => {
            addFiles(event.target.files);

            event.target.value = "";
          }}
        />
      </label>
      {uploads.length > 0 ? (
        <ul className="upload-list" aria-live="polite">
          {uploads.map((item) => (
            <li key={item.id} data-status={item.status}>
              <span>{item.file.name}</span>
              <span>{item.error ?? STATUS_LABELS[item.status]}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

type UploadStatus = "waiting" | "uploading" | "failed";

type UploadItem = {
  readonly id: string;
  readonly file: File;
  readonly status: UploadStatus;
  readonly error?: string | undefined;
};
