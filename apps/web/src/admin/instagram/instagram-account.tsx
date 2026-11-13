import { useMutation } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { toast } from "sonner";

import type { getAdminInstagram } from "@/server/instagram/instagram.functions";

import { disconnectInstagram } from "@/server/instagram/instagram.functions";

/** A server route, not a page: a full navigation that ends at Instagram Login. */
const CONNECT_URL = "/api/instagram/connect";

const dateOf = (date: Date) => format(date, "d MMM yyyy");

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

  const disconnect = useServerFn(disconnectInstagram);

  const disconnectMutation = useMutation({
    mutationFn: () => disconnect(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: instagramQueryKeys.all }),
    onError: (error) => toast.error(error.message || "Instagram could not be disconnected"),
  });

  if (!view.configured) {
    return (
      <div className="panel">
        <p>Instagram is not switched on for this site yet.</p>
        <p className="field-hint">
          Your web developer finishes a one-time setup with Meta. After that, a &ldquo;Connect
          Instagram&rdquo; button appears here.
        </p>
      </div>
    );
  }

  if (view.connection === null) {
    return (
      <div className="panel instagram-account">
        <div>
          <p>No account is connected.</p>
          <p className="field-hint">
            Instagram asks you to log in: use Daniel&apos;s account. When you come back here, the
            News page is live.
          </p>
        </div>
        <ConnectButton label="Connect Instagram" />
      </div>
    );
  }

  if (view.connection.expired) {
    return (
      <div className="panel instagram-account">
        <p className="form-error">
          The access to @{view.connection.username} expired on{" "}
          {dateOf(view.connection.tokenExpiresAt)}. The News page shows no posts until you connect
          again.
        </p>
        <ConnectButton label="Connect again" />
      </div>
    );
  }

  return (
    <div className="panel instagram-account">
      <div>
        <p>
          <b>@{view.connection.username}</b>
        </p>
        <p className="field-hint">
          Connected on {dateOf(view.connection.connectedAt)}. The site renews its access by itself.
        </p>
      </div>
      <div className="admin-photo-actions">
        <ConnectButton label="Connect another account" />
        <button
          className="btn btn-danger"
          type="button"
          disabled={disconnectMutation.isPending}
          onClick={() => {
            if (
              window.confirm(
                "Disconnect Instagram? The News page shows no posts until you connect again.",
              )
            ) {
              disconnectMutation.mutate();
            }
          }}
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}

type InstagramAdminView = Awaited<ReturnType<typeof getAdminInstagram>>;
