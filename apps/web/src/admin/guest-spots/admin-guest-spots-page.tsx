import { studioToday } from "@daniel/shared/studio";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Fragment, useState } from "react";
import { toast } from "sonner";

import { formatDateRange } from "@/components/format-date-range";
import { guestSpotQueryKeys } from "@/integrations/tanstack-query/guest-spot-query-options";
import { deleteGuestSpot } from "@/server/guest-spots/guest-spots.functions";

import { useAdminText } from "../use-admin-text";
import { GuestSpotForm } from "./guest-spot-form";

/** Manages guest spots. Past spots stay in the list, greyed out, and are hidden on the site. */
export function AdminGuestSpotsPage() {
  const context = useRouteContext({ from: "/admin/_dashboard/guest-spots" });

  const { locale, t } = useAdminText();

  const [editingId, setEditingId] = useState<string | null>(null);

  const removeSpot = useServerFn(deleteGuestSpot);

  const { data: spots } = useSuspenseQuery(context.adminGuestSpotsQueryOptions);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeSpot({ data: { id } }),
    onSuccess: async () => {
      await context.queryClient.invalidateQueries({ queryKey: guestSpotQueryKeys.all });
    },
    onError: (error) => toast.error(error.message || t.guestSpots.deleteFailed),
  });

  const today = studioToday();

  return (
    <>
      <p className="eyebrow">
        <b>{t.nav.label}</b> {t.guestSpots.title}
      </p>
      <h1>{t.guestSpots.title}</h1>
      <p className="lead">{t.guestSpots.lead}</p>

      <section className="admin-section">
        <h2>{t.guestSpots.add}</h2>
        <GuestSpotForm onDone={() => undefined} />
      </section>

      <section className="admin-section">
        <h2>{t.guestSpots.all}</h2>
        {spots.length === 0 ? (
          <p className="empty-state">{t.guestSpots.empty}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t.guestSpots.dates}</th>
                <th>{t.guestSpots.place}</th>
                <th>{t.guestSpots.booking}</th>
                <th>
                  <span className="visually-hidden">{t.guestSpots.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {spots.map((spot) => (
                <Fragment key={spot.id}>
                  <tr data-past={spot.endsOn < today}>
                    <td>{formatDateRange(spot.startsOn, spot.endsOn, locale)}</td>
                    <td>
                      {spot.city}, {spot.country}
                      <br />
                      {spot.studioName}
                    </td>
                    <td>
                      {spot.endsOn < today ? t.guestSpots.past : t.guestSpots.status[spot.status]}
                    </td>
                    <td aria-label={t.guestSpots.actionsFor(spot.city)}>
                      <div className="row-actions">
                        <button
                          className="btn btn-ghost btn-small"
                          type="button"
                          onClick={() => setEditingId(editingId === spot.id ? null : spot.id)}
                        >
                          {t.common.edit}
                        </button>
                        <button
                          className="btn btn-danger btn-small"
                          type="button"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (window.confirm(t.guestSpots.confirmDelete(spot.city))) {
                              deleteMutation.mutate(spot.id);
                            }
                          }}
                        >
                          {t.common.delete}
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
