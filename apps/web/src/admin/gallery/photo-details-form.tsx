import { UpdateGalleryPhotoInput } from "@daniel/shared/gallery";
import { revalidateLogic } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Schema } from "effect";

import { useAppForm } from "@/forms/form";
import { showFormError } from "@/forms/server-errors";
import { galleryQueryKeys } from "@/integrations/tanstack-query/gallery-query-options";
import { updateGalleryPhoto } from "@/server/gallery/gallery.functions";

import { useAdminText } from "../use-admin-text";

/** Edits the title, series, and placement of a photo. Closes after a successful save. */
export function PhotoDetailsForm({ photo, onClose }: PhotoDetailsFormProps) {
  const { queryClient } = useRouteContext({ from: "/admin/_dashboard/gallery" });

  const { t } = useAdminText();

  const update = useServerFn(updateGalleryPhoto);

  const mutation = useMutation({
    mutationFn: (data: UpdateGalleryPhotoInput) => update({ data }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: galleryQueryKeys.all });

      onClose();
    },
  });

  const defaultValues: UpdateGalleryPhotoInput = {
    id: photo.id,
    title: photo.title ?? "",
    series: photo.series ?? "",
    placement: photo.placement ?? "",
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
      <form.AppField name="series">
        {(field) => <field.TextField label={t.gallery.details.series} placeholder="Berserk" />}
      </form.AppField>
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
    readonly title: string | null;
    readonly series: string | null;
    readonly placement: string | null;
  };
  readonly onClose: () => void;
};
