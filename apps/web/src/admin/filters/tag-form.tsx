import { GalleryTagNames } from "@daniel/shared/gallery";
import { revalidateLogic } from "@tanstack/react-form";
import { Schema } from "effect";

import { useAppForm } from "@/forms/form";
import { showFormError } from "@/forms/server-errors";
import { LOCALES } from "@/i18n/locales";

import { useAdminText } from "../use-admin-text";

/**
 * The name of a theme or series and its optional translations. `onSave` sends them; after it
 * succeeds, `onSaved` runs, or the form empties itself for the next one when there is none.
 */
export function TagForm({
  initial,
  placeholder,
  submitLabel,
  onSave,
  onSaved,
  onCancel,
}: TagFormProps) {
  const { t } = useAdminText();

  const form = useAppForm({
    defaultValues: initial,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(GalleryTagNames) },
    onSubmit: async ({ value }) => {
      try {
        await onSave(value);
      } catch (error) {
        showFormError(form, error, t.filters.saveFailed);

        return;
      }

      if (onSaved === undefined) {
        form.reset();

        return;
      }

      onSaved();
    },
  });

  return (
    <form
      className="form tag-form"
      onSubmit={(event) => {
        event.preventDefault();

        void form.handleSubmit();
      }}
    >
      <form.AppField name="name">
        {(field) => (
          <field.TextField
            label={t.filters.name}
            hint={t.filters.nameHint}
            placeholder={placeholder}
          />
        )}
      </form.AppField>
      <details className="tag-translations">
        <summary>{t.filters.translations}</summary>
        <div className="form-grid">
          {LOCALES.map((locale) => (
            <form.AppField key={locale} name={`translations.${locale}`}>
              {(field) => <field.TextField label={t.filters.languages[locale]} />}
            </form.AppField>
          ))}
        </div>
      </details>
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <div className="admin-photo-actions">
            <button className="btn btn-red btn-small" type="submit" disabled={isSubmitting}>
              {isSubmitting ? t.common.saving : submitLabel}
            </button>
            {onCancel === undefined ? null : (
              <button className="btn btn-ghost btn-small" type="button" onClick={onCancel}>
                {t.common.cancel}
              </button>
            )}
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}

type TagFormProps = {
  readonly initial: typeof GalleryTagNames.Encoded;
  readonly placeholder: string;
  readonly submitLabel: string;
  readonly onSave: (names: GalleryTagNames) => Promise<unknown>;
  readonly onSaved?: () => void;
  readonly onCancel?: () => void;
};
