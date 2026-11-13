import { studioToday } from "@daniel/shared/studio";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";
import { format, parseISO, subMonths } from "date-fns";

import { DATE_LOCALES } from "@/i18n/locales";

import { useAdminText } from "../use-admin-text";

/** How long the privacy notice lets an enquiry stay without a booking. */
const RETENTION_MONTHS = 12;

/**
 * The enquiries sent through the site's form, the newest first, with their stage and whether the
 * studio's email went out. Enquiries older than the privacy notice allows are flagged.
 */
export function AdminEnquiriesPage() {
  const context = useRouteContext({ from: "/admin/_dashboard/enquiries/" });

  const { locale, t } = useAdminText();
  const e = t.enquiries;

  const { data: enquiries } = useSuspenseQuery(context.adminEnquiriesQueryOptions);
  const { data: settings } = useSuspenseQuery(context.emailSettingsQueryOptions);

  const retentionLimit = format(subMonths(parseISO(studioToday()), RETENTION_MONTHS), "yyyy-MM-dd");

  return (
    <>
      <p className="eyebrow">
        <b>{t.nav.label}</b> {e.title}
      </p>
      <h1>{e.title}</h1>
      <p className="lead">{e.lead}</p>

      {settings.ready ? null : (
        <p className="panel admin-notice">
          {e.emailOff} <Link to="/admin/email">{e.emailSettings}</Link>
        </p>
      )}

      <section className="admin-section">
        {enquiries.length === 0 ? (
          <p className="empty-state">{e.empty}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{e.received}</th>
                <th>{e.client}</th>
                <th>{e.theme}</th>
                <th>{e.where}</th>
                <th>{e.stage}</th>
                <th>{e.emailColumn}</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((enquiry) => (
                <tr key={enquiry.id} data-status={enquiry.status}>
                  <td>
                    {format(enquiry.createdAt, "d MMM yyyy, HH:mm", {
                      locale: DATE_LOCALES[locale],
                    })}
                    {format(enquiry.createdAt, "yyyy-MM-dd") < retentionLimit ? (
                      <p className="field-error">{e.old}</p>
                    ) : null}
                  </td>
                  <td>
                    <Link to="/admin/enquiries/$id" params={{ id: enquiry.id }}>
                      {enquiry.name}
                    </Link>
                    <br />
                    <span className="muted">@{enquiry.instagram}</span>
                  </td>
                  <td>{enquiry.theme}</td>
                  <td>
                    {e.location[enquiry.locationKind]}
                    {enquiry.locationDetail === null ? null : (
                      <>
                        <br />
                        <span className="muted">{enquiry.locationDetail}</span>
                      </>
                    )}
                  </td>
                  <td>
                    <span className="status-pill" data-status={enquiry.status}>
                      {e.status[enquiry.status]}
                    </span>
                  </td>
                  <td>{e.emailStatus[enquiry.emailStatus]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
