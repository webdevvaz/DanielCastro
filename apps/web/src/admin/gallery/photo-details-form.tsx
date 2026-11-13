import type { GallerySection } from "@daniel/shared/gallery";

import { UpdateGalleryPhotoInput } from "@daniel/shared/gallery";
import { revalidateLogic } from "@tanstack/react-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Schema } from "effect";
import { useId } from "react";

import { useAppForm } from "@/forms/form";
import { showFormError } from "@/forms/server-errors";
import { tagLabel } from "@/gallery/tag-label";
import { galleryQueryKeys } from "@/integrations/tanstack-query/gallery-query-options";
import { updateGalleryPhoto } from "@/server/gallery/gallery.functions";

import { useAdminText } from "../use-admin-text";

/**
 * Edits the title and placement of a photo, and, for a work photo, its series and themes. Closes
 * after a successful save.
 */
export function PhotoDetailsForm({ photo, onClose }: PhotoDetailsFormProps) {
  const context = useRouteContext({ from: "/admin/_dashboard/gallery" });

  const { locale, t } = useAdminText();

  const seriesSelectId = useId();

  const update = useServerFn(updateGalleryPhoto);

  const { data: tags } = useSuspenseQuery(context.galleryTagsQueryOptions);

  const mutation = useMutation({
    mutationFn: (data: UpdateGalleryPhotoInput) => update({ data }),
    onSuccess: async () => {
      await context.queryClient.invalidateQueries({ queryKey: galleryQueryKeys.all });

      onClose();
    },
  });

  const series = tags.filter((tag) => tag.kind === "series");
  const themes = tags.filter((tag) => tag.kind === "theme");

  const defaultValues: UpdateGalleryPhotoInput = {
    id: photo.id,
    title: photo.title ?? "",
    placement: photo.placement ?? "",
    seriesId: photo.seriesId,
    themeIds: photo.themeIds,
  };

  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(UpdateGalleryPhotoInput) },
    onSubmit: async ({ value }) => {
      await mutation
        .mutateAsync(value)
        .catch((error: unknown) => showFormError(form, error, t.gallery.details.saveFailed));
    },
  });

  return (
    <form
      className="form"
      onSubmit={(event) => {
        event.preventDefault();

        void form.handleSubmit();
      }}
    >
      <form.AppField name="title">
        {(field) => <field.TextField label={t.gallery.details.title} placeholder="Skull Knight" />}
      </form.AppField>
      {photo.section === "work" && tags.length === 0 ? (
        <p className="muted">{t.gallery.details.noTags}</p>
      ) : null}
      {photo.section === "work" && series.length > 0 ? (
        <form.Field name="seriesId">
          {(field) => (
            <div className="field">
              <label className="field-label" htmlFor={seriesSelectId}>
                {t.gallery.details.series}
              </label>
              <select
                className="input"
                id={seriesSelectId}
                value={field.state.value ?? ""}
                onChange={(event) =>
                  field.handleChange(event.target.value === "" ? null : event.target.value)
                }
              >
                <option value="">{t.gallery.details.noSeries}</option>
                {series.map((item) => (
                  <option key={item.id} value={item.id}>
                    {tagLabel(item, locale)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </form.Field>
      ) : null}
      {photo.section === "work" && themes.length > 0 ? (
        <form.Field name="themeIds">
          {(field) => (
            <fieldset className="field theme-checks">
              <legend className="field-label">{t.gallery.details.themes}</legend>
              {themes.map((theme) => (
                <label className="field-check" key={theme.id}>
                  <input
                    type="checkbox"
                    checked={field.state.value.includes(theme.id)}
                    onChange={(event) =>
                      field.handleChange(
                        event.target.checked
                          ? [...field.state.value, theme.id]
                          : field.state.value.filter((id) => id !== theme.id),
                      )
                    }
                  />
                  <span>{tagLabel(theme, locale)}</span>
                </label>
              ))}
            </fieldset>
          )}
        </form.Field>
      ) : null}
      <form.AppField name="placement">
        {(field) => (
          <field.TextField
            label={t.gallery.details.placement}
            placeholder={t.gallery.details.placementPlaceholder}
          />
        )}
      </form.AppField>
      <div className="admin-photo-actions">
        <button className="btn btn-red btn-small" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? t.common.saving : t.common.save}
        </button>
        <button className="btn btn-ghost btn-small" type="button" onClick={onClose}>
          {t.common.cancel}
        </button>
      </div>
    </form>
  );
}

type PhotoDetailsFormProps = {
  readonly photo: {
    readonly id: string;
    readonly section: GallerySection;
    readonly title: string | null;
    readonly placement: string | null;
    readonly seriesId: string | null;
    readonly themeIds: ReadonlyArray<string>;
  };
  readonly onClose: () => void;
};
