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

/** Empty number inputs, for the first time an admin sets the figures. */
const NO_SETTINGS: UpdateTravelSettingsInput = {
  coachFareEuros: Number.NaN,
  coachMinutes: Number.NaN,
  carDayMinEuros: Number.NaN,
  carDayMaxEuros: Number.NaN,
  rideMinEuros: Number.NaN,
  rideMaxEuros: Number.NaN,
  driveMinutes: Number.NaN,
  hotelFromEuros: Number.NaN,
  hotelTypicalMinEuros: Number.NaN,
  hotelTypicalMaxEuros: Number.NaN,
};

/** The transport and hotel figures that the travel page shows. */
export function TravelSettingsForm({ settings }: { settings: UpdateTravelSettingsInput | null }) {
  const { queryClient } = useRouteContext({ from: "/admin/_dashboard/travel" });

  const save = useServerFn(updateTravelSettings);

  const mutation = useMutation({
    mutationFn: (value: UpdateTravelSettingsInput) => save({ data: value }),
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
        .catch((error: unknown) =>
          showFormError(form, error, "The travel figures could not be saved"),
        );
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
      <h3 className="form-section-title">Porto airport to Braga</h3>
      <div className="form-grid">
        <form.AppField name="coachFareEuros">
          {(field) => (
            <field.NumberField
              label="Bus fare, one way (€)"
              hint="Get Bus, from the airport"
              min={0}
            />
          )}
        </form.AppField>
        <form.AppField name="coachMinutes">
          {(field) => <field.NumberField label="Bus journey (minutes)" min={1} />}
        </form.AppField>
        <form.AppField name="carDayMinEuros">
          {(field) => (
            <field.NumberField
              label="Rental car per day, low (€)"
              hint="Small car, outside summer"
              min={0}
            />
          )}
        </form.AppField>
        <form.AppField name="carDayMaxEuros">
          {(field) => <field.NumberField label="Rental car per day, high (€)" min={0} />}
        </form.AppField>
        <form.AppField name="rideMinEuros">
          {(field) => (
            <field.NumberField label="Uber, low (€)" hint="Airport to the studio" min={0} />
          )}
        </form.AppField>
        <form.AppField name="rideMaxEuros">
          {(field) => <field.NumberField label="Uber, high (€)" min={0} />}
        </form.AppField>
        <form.AppField name="driveMinutes">
          {(field) => (
            <field.NumberField label="Drive time (minutes)" hint="By rental car or Uber" min={1} />
          )}
        </form.AppField>
      </div>

      <h3 className="form-section-title">Hotels in Braga, when live prices are not available</h3>
      <div className="form-grid">
        <form.AppField name="hotelFromEuros">
          {(field) => (
            <field.NumberField
              label="Cheapest hotel, per night (€)"
              hint="Shown as “hotels from”"
              min={0}
            />
          )}
        </form.AppField>
        <div />
        <form.AppField name="hotelTypicalMinEuros">
          {(field) => (
            <field.NumberField
              label="Typical hotel, low (€)"
              hint="What most visitors pay per night"
              min={0}
            />
          )}
        </form.AppField>
        <form.AppField name="hotelTypicalMaxEuros">
          {(field) => <field.NumberField label="Typical hotel, high (€)" min={0} />}
        </form.AppField>
      </div>

      <div className="admin-photo-actions">
        <button className="btn btn-red btn-small" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
