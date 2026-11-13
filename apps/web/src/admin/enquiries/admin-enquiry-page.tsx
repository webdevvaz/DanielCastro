import type { EnquiryStatus } from "@daniel/shared/enquiry";

import { ENQUIRY_PHOTO_KINDS, ENQUIRY_STATUSES } from "@daniel/shared/enquiry";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams, useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { toast } from "sonner";

import { enquiryPhotoUrl } from "@/enquiries/enquiry-files";
import { DATE_LOCALES, LOCALE_NAMES } from "@/i18n/locales";
import { enquiryQueryKeys } from "@/integrations/tanstack-query/enquiry-query-options";
import {
  deleteEnquiry,
  resendEnquiryEmail,
  updateEnquiryStatus,
} from "@/server/enquiries/enquiry.functions";

import { useAdminText } from "../use-admin-text";

/**
 * One enquiry: every answer, the photos (open one to see it full size), the stage, and whether
 * the studio's email went out, with a button to send it when it did not.
 */
export function AdminEnquiryPage() {
  const context = useRouteContext({ from: "/admin/_dashboard/enquiries/$id" });
  const { id } = useParams({ from: "/admin/_dashboard/enquiries/$id" });
  const navigate = useNavigate();

  const { locale, t } = useAdminText();
  const e = t.enquiries;

  const { data: enquiry } = useSuspenseQuery(context.adminEnquiryQueryOptions(id));

  const changeStatus = useServerFn(updateEnquiryStatus);
  const sendEmail = useServerFn(resendEnquiryEmail);
  const remove = useServerFn(deleteEnquiry);

  const refresh = () => context.queryClient.invalidateQueries({ queryKey: enquiryQueryKeys.all });

  const statusMutation = useMutation({
    mutationFn: (status: EnquiryStatus) => changeStatus({ data: { id: enquiry.id, status } }),
    onSuccess: refresh,
    onError: (error) => toast.error(error.message || e.stageFailed),
  });

  const emailMutation = useMutation({
    mutationFn: () => sendEmail({ data: { id: enquiry.id } }),
    onSettled: refresh,
    onError: (error) => toast.error(error.message || e.sendFailed),
  });

  const deleteMutation = useMutation({
    mutationFn: () => remove({ data: { id: enquiry.id } }),
    onSuccess: async () => {
      context.queryClient.removeQueries({ queryKey: enquiryQueryKeys.detail(enquiry.id) });

      await navigate({ to: "/admin/enquiries" });

      await refresh();
    },
    onError: (error) => toast.error(error.message || e.deleteFailed),
  });

  const dateOf = (date: Date) =>
    format(date, "d MMM yyyy, HH:mm", { locale: DATE_LOCALES[locale] });

  const emailNote = {
    sent: e.emailSentOn(enquiry.emailSentAt === null ? "" : dateOf(enquiry.emailSentAt)),
    failed: e.emailFailed,
    not_configured: e.emailNotSent,
  }[enquiry.emailStatus];

  const answers = [
    { label: e.received, value: dateOf(enquiry.createdAt) },
    { label: e.age, value: String(enquiry.age) },
    { label: e.email, value: enquiry.email },
    { label: e.phone, value: enquiry.phone ?? e.none },
    { label: e.city, value: `${enquiry.city}, ${enquiry.country}` },
    {
      label: e.where,
      value:
        enquiry.locationDetail === null
          ? e.location[enquiry.locationKind]
          : `${e.location[enquiry.locationKind]}: ${enquiry.locationDetail}`,
    },
    { label: e.language, value: LOCALE_NAMES[enquiry.locale] },
    { label: e.theme, value: enquiry.theme },
  ];

  return (
    <>
      <p className="eyebrow">
        <Link to="/admin/enquiries">{e.back}</Link>
      </p>
      <h1>{enquiry.name}</h1>
      <p className="lead">
        <a
          href={`https://www.instagram.com/${encodeURIComponent(enquiry.instagram)}/`}
          target="_blank"
          rel="noreferrer"
        >
          @{enquiry.instagram}
        </a>
      </p>

      <section className="panel admin-enquiry-actions">
        <label className="field">
          <span className="field-label">{e.stage}</span>
          <select
            className="input"
            value={enquiry.status}
            disabled={statusMutation.isPending}
            onChange={(event) => {
              const status = ENQUIRY_STATUSES.find((value) => value === event.target.value);

              if (status !== undefined) statusMutation.mutate(status);
            }}
          >
            {ENQUIRY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {e.status[status]}
              </option>
            ))}
          </select>
        </label>
        <div>
          <p>{emailNote}</p>
          <div className="actions">
            <a className="btn btn-red btn-small" href={`mailto:${enquiry.email}`}>
              {e.reply}
            </a>
            {enquiry.emailStatus === "sent" ? null : (
              <button
                className="btn btn-ghost btn-small"
                type="button"
                disabled={emailMutation.isPending}
                onClick={() => emailMutation.mutate()}
              >
                {emailMutation.isPending ? e.sendingEmail : e.sendEmail}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="admin-section">
        <h2>{e.answers}</h2>
        <dl className="admin-answers">
          {answers.map((answer) => (
            <div key={answer.label}>
              <dt>{answer.label}</dt>
              <dd>{answer.value}</dd>
            </div>
          ))}
        </dl>
        <h3>{e.description}</h3>
        <p className="admin-long-text">{enquiry.description}</p>
        <h3>{e.questions}</h3>
        <p className="admin-long-text">{enquiry.questions ?? e.none}</p>
      </section>

      {ENQUIRY_PHOTO_KINDS.map((kind) => {
        const photos = enquiry.photos.filter((photo) => photo.kind === kind);

        return (
          <section className="admin-section" key={kind}>
            <h2>{e.photos[kind]}</h2>
            <ul className="admin-enquiry-photos">
              {photos.map((photo, index) => {
                const url = enquiryPhotoUrl(enquiry.id, photo.id);

                return (
                  <li key={photo.id}>
                    <a href={url} target="_blank" rel="noreferrer">
                      <img
                        src={url}
                        alt={e.photoAlt(e.photos[kind], index + 1)}
                        width={photo.width}
                        height={photo.height}
                        loading="lazy"
                      />
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <section className="admin-section">
        <button
          className="btn btn-danger btn-small"
          type="button"
          disabled={deleteMutation.isPending}
          onClick={() => {
            if (window.confirm(e.confirmDelete(enquiry.name))) deleteMutation.mutate();
          }}
        >
          {e.delete}
        </button>
      </section>
    </>
  );
}
