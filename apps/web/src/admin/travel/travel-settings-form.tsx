import { UpdateTravelSettingsInput } from "@daniel/shared/travel";
import { revalidateLogic } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Schema } from "effect";

import { useAppForm } from "@/forms/form";
import { showFormError } from "@/forms/server-errors";
import { travelQueryKeys } from "@/integrations/tanstack-query/travel-query-options";
import { updateTravelSettings } from "@/server/travel/travel.functions";

import { useAdminText } from "../use-admin-text";

/** Empty number inputs, for the first time an admin sets the figures. */
const NO_SETTINGS: typeof UpdateTravelSettingsInput.Encoded = {
  coachFareEuros: null,
  coachMinutes: null,
  carDayMinEuros: null,
  carDayMaxEuros: null,
  rideMinEuros: null,
  rideMaxEuros: null,
  driveMinutes: null,
  hotelFromEuros: null,
  hotelTypicalMinEuros: null,
  hotelTypicalMaxEuros: null,
};

/** The transport and hotel figures that the travel page shows. */
export function TravelSettingsForm({ settings }: { settings: UpdateTravelSettingsInput | null }) {
  const { queryClient } = useRouteContext({ from: "/admin/_dashboard/travel" });

  const { t } = useAdminText();
  const f = t.travel.form;

  const save = useServerFn(updateTravelSettings);

  const mutation = useMutation({
    mutationFn: (value: typeof UpdateTravelSettingsInput.Encoded) => save({ data: value }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: travelQueryKeys.all });
    },
  });

  const form = useAppForm({
    defaultValues: settings ?? NO_SETTINGS,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(UpdateTravelSettingsInput) },
    onSubmit: async ({ value }) => {
      await mutation
        .mutateAsync(value)
        .catch((error: unknown) => showFormError(form, error, f.saveFailed));
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
      <h3 className="form-section-title">{f.airportTitle}</h3>
      <div className="form-grid">
        <form.AppField name="coachFareEuros">
          {(field) => <field.NumberField label={f.busFare} hint={f.busFareHint} min={0} />}
        </form.AppField>
        <form.AppField name="coachMinutes">
          {(field) => <field.NumberField label={f.busMinutes} min={1} />}
        </form.AppField>
        <form.AppField name="carDayMinEuros">
          {(field) => <field.NumberField label={f.carLow} hint={f.carLowHint} min={0} />}
        </form.AppField>
        <form.AppField name="carDayMaxEuros">
          {(field) => <field.NumberField label={f.carHigh} min={0} />}
        </form.AppField>
        <form.AppField name="rideMinEuros">
          {(field) => <field.NumberField label={f.uberLow} hint={f.uberLowHint} min={0} />}
        </form.AppField>
        <form.AppField name="rideMaxEuros">
          {(field) => <field.NumberField label={f.uberHigh} min={0} />}
        </form.AppField>
        <form.AppField name="driveMinutes">
          {(field) => <field.NumberField label={f.driveMinutes} hint={f.driveHint} min={1} />}
        </form.AppField>
      </div>

      <h3 className="form-section-title">{f.hotelsTitle}</h3>
      <div className="form-grid">
        <form.AppField name="hotelFromEuros">
          {(field) => <field.NumberField label={f.hotelFrom} hint={f.hotelFromHint} min={0} />}
        </form.AppField>
        <div />
        <form.AppField name="hotelTypicalMinEuros">
          {(field) => <field.NumberField label={f.hotelLow} hint={f.hotelLowHint} min={0} />}
        </form.AppField>
        <form.AppField name="hotelTypicalMaxEuros">
          {(field) => <field.NumberField label={f.hotelHigh} min={0} />}
        </form.AppField>
      </div>

      <div className="admin-photo-actions">
        <button className="btn btn-red btn-small" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? t.common.saving : t.common.save}
        </button>
      </div>
    </form>
  );
}
