import { useId, useState } from "react";

import { shrinkPhoto } from "./shrink-photo";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";

/** Forgets the preview of a photo that leaves the form. */
export const releasePhoto = (photo: PickedPhoto) => {
  URL.revokeObjectURL(photo.previewUrl);
};

/**
 * One group of enquiry photos: pick them from a phone or a computer, see them, and remove them.
 * Each photo is shrunk in the browser before it is kept, so the upload stays small. Files the
 * browser cannot read as images are left out and named in an error.
 */
export function PhotoPicker({ label, hint, max, photos, error, text, onChange }: PhotoPickerProps) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  const [preparing, setPreparing] = useState(false);
  const [rejected, setRejected] = useState<ReadonlyArray<string>>([]);

  const addFiles = async (files: FileList | null) => {
    if (files === null || files.length === 0) return;

    const room = Math.max(0, max - photos.length);
    const picked = Array.from(files).slice(0, room);

    setPreparing(true);

    const results = await Promise.all(
      picked.map(async (file) => ({ name: file.name, shrunk: await shrinkPhoto(file) })),
    );

    setPreparing(false);

    const added = results.flatMap(({ shrunk }) =>
      shrunk === null
        ? []
        : [{ id: crypto.randomUUID(), file: shrunk, previewUrl: URL.createObjectURL(shrunk) }],
    );

    setRejected(results.flatMap(({ name, shrunk }) => (shrunk === null ? [name] : [])));

    onChange((current) => [...current, ...added].slice(0, max));
  };

  const remove = (photo: PickedPhoto) => {
    releasePhoto(photo);

    onChange((current) => current.filter((entry) => entry.id !== photo.id));
  };

  const messages = [...rejected.map((name) => text.notImage(name)), error].filter(
    (message) => message !== null,
  );

  return (
    <div className="field photo-picker">
      <span className="field-label" id={`${inputId}-label`}>
        {label}
      </span>
      <p className="field-hint" id={hintId}>
        {hint}
      </p>
      {photos.length > 0 ? (
        <ul className="photo-picker-list">
          {photos.map((photo, index) => (
            <li key={photo.id}>
              <img src={photo.previewUrl} alt="" />
              <button
                className="photo-picker-remove"
                type="button"
                aria-label={text.remove(index + 1)}
                onClick={() => remove(photo)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="photo-picker-actions">
        {photos.length < max ? (
          <label className="btn btn-ghost btn-small" htmlFor={inputId}>
            {text.add}
          </label>
        ) : null}
        <span className="muted">{preparing ? text.preparing : text.count(photos.length, max)}</span>
      </div>
      <input
        className="visually-hidden"
        id={inputId}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple
        aria-labelledby={`${inputId}-label`}
        aria-describedby={messages.length > 0 ? errorId : hintId}
        aria-invalid={messages.length > 0}
        disabled={preparing}
        onChange={(event) => {
          const input = event.currentTarget;

          void addFiles(input.files).finally(() => {
            input.value = "";
          });
        }}
      />
      {messages.length > 0 ? (
        <div id={errorId} role="alert">
          {messages.map((message) => (
            <p className="field-error" key={message}>
              {message}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** A photo the client picked, already shrunk, with its preview address. */
export type PickedPhoto = {
  readonly id: string;
  readonly file: File;
  readonly previewUrl: string;
};

type PhotoPickerProps = {
  readonly label: string;
  readonly hint: string;
  readonly max: number;
  readonly photos: ReadonlyArray<PickedPhoto>;
  /** The count problem found on submit, or null. */
  readonly error: string | null;
  readonly text: {
    readonly add: string;
    readonly preparing: string;
    readonly remove: (position: number) => string;
    readonly count: (count: number, max: number) => string;
    readonly notImage: (name: string) => string;
  };
  /** Receives a change to apply to the current photos. */
  readonly onChange: (
    update: (photos: ReadonlyArray<PickedPhoto>) => ReadonlyArray<PickedPhoto>,
  ) => void;
};
