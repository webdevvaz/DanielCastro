import { CreateGuestSpotInput } from "@daniel/shared/guest-spots";
import { revalidateLogic } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Schema } from "effect";

import { useAppForm } from "@/forms/form";
import { showFormError } from "@/forms/server-errors";
import { guestSpotQueryKeys } from "@/integrations/tanstack-query/guest-spot-query-options";
import { createGuestSpot, updateGuestSpot } from "@/server/guest-spots/guest-spots.functions";

import type { AdminGuestSpot } from "./admin-guest-spot";

import { useAdminText } from "../use-admin-text";

const EMPTY_SPOT: CreateGuestSpotInput = {
  city: "",
  country: "",
  studioName: "",
  address: "",
  startsOn: "",
  endsOn: "",
  status: "open",
  note: "",
};

/** The form values for an existing spot. Empty optional fields come back as empty text. */
const valuesOf = (spot: AdminGuestSpot): CreateGuestSpotInput => ({
  city: spot.city,
  country: spot.country,
  studioName: spot.studioName,
  address: spot.address ?? "",
  startsOn: spot.startsOn,
  endsOn: spot.endsOn,
  status: spot.status,
  note: spot.note ?? "",
});

/**
 * Adds a guest spot, or edits `spot` when it is given. After a save, `onDone` runs; a new spot's
 * form is also cleared for the next one.
 */
export function GuestSpotForm({ spot, onDone }: GuestSpotFormProps) {
  const { queryClient } = useRouteContext({ from: "/admin/_dashboard/guest-spots" });

  const { t } = useAdminText();

  const create = useServerFn(createGuestSpot);
  const update = useServerFn(updateGuestSpot);

  const mutation = useMutation({
    mutationFn: async (value: CreateGuestSpotInput) => {
      if (spot === undefined) {
        await create({ data: value });

        return;
      }

      await update({ data: { id: spot.id, ...value } });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: guestSpotQueryKeys.all });

      onDone();
    },
  });

  const defaultValues = spot === undefined ? EMPTY_SPOT : valuesOf(spot);
  const submitLabel = spot === undefined ? t.guestSpots.form.submit : t.common.save;
  const statusOptions = [
    { value: "open", label: t.guestSpots.status.open },
    { value: "full", label: t.guestSpots.status.full },
  ];

  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(CreateGuestSpotInput) },
    onSubmit: async ({ value, formApi }) => {
      await mutation
        .mutateAsync(value)
        .then(() => {
          if (spot === undefined) formApi.reset();
        })
        .catch((error: unknown) => showFormError(form, error, t.guestSpots.form.saveFailed));
    },
  });

  return (
    <form
      className="form panel"
      onSubmit={(event) => {
        event.preventDefault();

        void form.handleSubmit();
      }}
    >
      <div className="form-grid">
        <form.AppField name="city">
          {(field) => <field.TextField label={t.guestSpots.form.city} placeholder="Düsseldorf" />}
        </form.AppField>
        <form.AppField name="country">
          {(field) => (
            <field.TextField
              label={t.guestSpots.form.country}
              placeholder={t.guestSpots.form.countryPlaceholder}
            />
          )}
        </form.AppField>
        <form.AppField name="studioName">
          {(field) => <field.TextField label={t.guestSpots.form.studio} />}
        </form.AppField>
        <form.AppField name="address">
          {(field) => (
            <field.TextField label={t.guestSpots.form.address} hint={t.common.optional} />
          )}
        </form.AppField>
        <form.AppField name="startsOn">
          {(field) => <field.TextField label={t.guestSpots.form.firstDay} type="date" />}
        </form.AppField>
        <form.AppField name="endsOn">
          {(field) => <field.TextField label={t.guestSpots.form.lastDay} type="date" />}
        </form.AppField>
        <form.AppField name="status">
          {(field) => <field.SelectField label={t.guestSpots.booking} options={statusOptions} />}
        </form.AppField>
        <form.AppField name="note">
          {(field) => (
            <field.TextField label={t.guestSpots.form.note} hint={t.guestSpots.form.noteHint} />
          )}
        </form.AppField>
      </div>
      <div className="admin-photo-actions">
        <button className="btn btn-red btn-small" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? t.common.saving : submitLabel}
        </button>
        {spot === undefined ? null : (
          <button className="btn btn-ghost btn-small" type="button" onClick={onDone}>
            {t.common.cancel}
          </button>
        )}
      </div>
    </form>
  );
}

type GuestSpotFormProps = {
  readonly spot?: AdminGuestSpot;
  readonly onDone: () => void;
};
