import { useMutation } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { toast } from "sonner";

import type { getAdminInstagram } from "@/server/instagram/instagram.functions";

import { DATE_LOCALES } from "@/i18n/locales";
import { disconnectInstagram } from "@/server/instagram/instagram.functions";

import { useAdminText } from "../use-admin-text";

/** A server route, not a page: a full navigation that ends at Instagram Login. */
const CONNECT_URL = "/api/instagram/connect";

/** Starts Instagram Login. */
function ConnectButton({ label }: { label: string }) {
  return (
    <a className="btn btn-red" href={CONNECT_URL}>
      {label}
    </a>
  );
}

/**
 * The connected Instagram account, or how to connect one. Connecting opens Instagram Login, where
 * Daniel logs in with his account; the site then keeps its access renewed.
 */
export function InstagramAccount({ view }: { view: InstagramAdminView }) {
  const { queryClient, instagramQueryKeys } = useRouteContext({
    from: "/admin/_dashboard/instagram",
  });

  const { locale, t } = useAdminText();

  const disconnect = useServerFn(disconnectInstagram);

  const disconnectMutation = useMutation({
    mutationFn: () => disconnect(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: instagramQueryKeys.all }),
    onError: (error) => toast.error(error.message || t.instagram.disconnectFailed),
  });

  const dateOf = (date: Date) => format(date, "d MMM yyyy", { locale: DATE_LOCALES[locale] });

  if (!view.configured) {
    return (
      <div className="panel">
        <p>{t.instagram.notConfigured}</p>
        <p className="field-hint">{t.instagram.notConfiguredHint}</p>
      </div>
    );
  }

  if (view.connection === null) {
    return (
      <div className="panel instagram-account">
        <div>
          <p>{t.instagram.notConnected}</p>
          <p className="field-hint">{t.instagram.notConnectedHint}</p>
        </div>
        <ConnectButton label={t.instagram.connect} />
      </div>
    );
  }

  if (view.connection.expired) {
    return (
      <div className="panel instagram-account">
        <p className="form-error">
          {t.instagram.expired(view.connection.username, dateOf(view.connection.tokenExpiresAt))}
        </p>
        <ConnectButton label={t.instagram.connectAgain} />
      </div>
    );
  }

  return (
    <div className="panel instagram-account">
      <div>
        <p>
          <b>@{view.connection.username}</b>
        </p>
        <p className="field-hint">{t.instagram.connectedOn(dateOf(view.connection.connectedAt))}</p>
      </div>
      <div className="admin-photo-actions">
        <ConnectButton label={t.instagram.connectAnother} />
        <button
          className="btn btn-danger"
          type="button"
          disabled={disconnectMutation.isPending}
          onClick={() => {
            if (window.confirm(t.instagram.confirmDisconnect)) disconnectMutation.mutate();
          }}
        >
          {t.instagram.disconnect}
        </button>
      </div>
    </div>
  );
}

type InstagramAdminView = Awaited<ReturnType<typeof getAdminInstagram>>;
