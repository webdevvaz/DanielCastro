import { useMutation } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { useAppForm } from "@/forms/form";
import { showFormError } from "@/forms/server-errors";
import { bookingQueryKeys } from "@/integrations/tanstack-query/booking-query-options";
import { updateBookingSettings } from "@/server/booking/booking.functions";

import { useAdminText } from "../use-admin-text";

/**
 * Opens or closes the books. While they are closed, the site's enquiry form shows a notice
 * instead, with the reopening day when one is set. The server checks the date.
 */
export function BookingSettingsForm({ booksOpen, reopensOn }: BookingSettingsFormProps) {
  const { queryClient } = useRouteContext({ from: "/admin/_dashboard/enquiries/" });

  const { t } = useAdminText();
  const b = t.booking;

  const save = useServerFn(updateBookingSettings);

  const mutation = useMutation({
    mutationFn: (value: BookingFormValues) =>
      save({
        data: {
          booksOpen: value.status === "open",
          reopensOn: value.status === "open" || value.reopensOn === "" ? null : value.reopensOn,
        },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bookingQueryKeys.all }),
  });

  const defaultValues: BookingFormValues = {
    status: booksOpen ? "open" : "closed",
    reopensOn: reopensOn ?? "",
  };

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await mutation
        .mutateAsync(value)
        .catch((error: unknown) => showFormError(form, error, b.saveFailed));
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
      <p className="booking-state" data-open={booksOpen}>
        <b>{booksOpen ? b.open : b.closed}</b> {booksOpen ? b.openText : b.closedText}
      </p>
      <div className="form-grid">
        <form.AppField name="status">
          {(field) => (
            <field.SelectField
              label={b.title}
              options={[
                { value: "open", label: b.open },
                { value: "closed", label: b.closed },
              ]}
            />
          )}
        </form.AppField>
        <form.Subscribe selector={(state) => state.values.status}>
          {(status) =>
            status === "closed" ? (
              <form.AppField name="reopensOn">
                {(field) => (
                  <field.TextField label={b.reopensOn} hint={b.reopensHint} type="date" />
                )}
              </form.AppField>
            ) : null
          }
        </form.Subscribe>
      </div>
      <div className="admin-photo-actions">
        <button className="btn btn-red btn-small" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? t.common.saving : t.common.save}
        </button>
      </div>
    </form>
  );
}

type BookingFormValues = {
  readonly status: "open" | "closed";
  readonly reopensOn: string;
};

type BookingSettingsFormProps = {
  readonly booksOpen: boolean;
  readonly reopensOn: string | null;
};
