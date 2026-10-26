import { studioToday } from "@daniel/shared/studio";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Fragment, useState } from "react";
import { toast } from "sonner";

import { formatDateRange } from "@/components/format-date-range";
import { guestSpotQueryKeys } from "@/integrations/tanstack-query/guest-spot-query-options";
import { deleteGuestSpot } from "@/server/guest-spots/guest-spots.functions";

import { GuestSpotForm } from "./guest-spot-form";

const STATUS_LABELS = { open: "Books open", full: "Fully booked" } as const;

/** Manages guest spots. Past spots stay in the list, greyed out, and are hidden on the site. */
export function AdminGuestSpotsPage() {
  const context = useRouteContext({ from: "/admin/_dashboard/guest-spots" });

  const [editingId, setEditingId] = useState<string | null>(null);

  const removeSpot = useServerFn(deleteGuestSpot);

  const { data: spots } = useSuspenseQuery(context.adminGuestSpotsQueryOptions);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeSpot({ data: { id } }),
    onSuccess: async () => {
      await context.queryClient.invalidateQueries({ queryKey: guestSpotQueryKeys.all });
    },
    onError: (error) => toast.error(error.message || "The guest spot could not be deleted"),
  });

  const today = studioToday();

  return (
    <>
      <p className="eyebrow">
        <b>Admin</b> Guest spots
      </p>
      <h1>Guest spots</h1>
      <p className="lead">
        Upcoming spots appear on the home page until their last day has passed.
      </p>

      <section className="admin-section">
        <h2>Add a guest spot</h2>
        <GuestSpotForm onDone={() => undefined} />
      </section>

      <section className="admin-section">
        <h2>All guest spots</h2>
        {spots.length === 0 ? (
          <p className="empty-state">No guest spots yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Dates</th>
                <th>Place</th>
                <th>Booking</th>
                <th>
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {spots.map((spot) => (
                <Fragment key={spot.id}>
                  <tr data-past={spot.endsOn < today}>
                    <td>{formatDateRange(spot.startsOn, spot.endsOn)}</td>
                    <td>
                      {spot.city}, {spot.country}
                      <br />
                      {spot.studioName}
                    </td>
                    <td>{spot.endsOn < today ? "Past" : STATUS_LABELS[spot.status]}</td>
                    <td aria-label={`Actions for ${spot.city}`}>
                      <div className="row-actions">
                        <button
                          className="btn btn-ghost btn-small"
                          type="button"
                          onClick={() => setEditingId(editingId === spot.id ? null : spot.id)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-small"
                          type="button"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (window.confirm(`Delete the guest spot in ${spot.city}?`)) {
                              deleteMutation.mutate(spot.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editingId === spot.id ? (
                    <tr>
                      <td colSpan={4}>
                        <GuestSpotForm spot={spot} onDone={() => setEditingId(null)} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
