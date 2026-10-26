import { isAppError } from "@daniel/shared/errors";
import { Link } from "@tanstack/react-router";

/** The status of a failed request, when the error carries one. */
function statusOf(error: unknown) {
  if (error instanceof Response) return error.status;

  if (isAppError(error)) return error.status;

  return null;
}

/** The title and text for an error status. */
function describe(status: number | null) {
  if (status === 401) {
    return { title: "Please sign in", text: "Your session has ended. Sign in again to continue." };
  }

  if (status === 403) {
    return { title: "No access", text: "Your account is not allowed to open this page." };
  }

  return {
    title: "Something went wrong",
    text: "The page could not be loaded, and the error was logged. Try again in a moment.",
  };
}

/**
 * The router's error page. Server functions deliver expected failures as `AppError` instances
 * (see `src/start.ts`), so the status comes from the server's typed error.
 */
export function RootErrorComponent({ error, reset }: RootErrorComponentProps) {
  const status = statusOf(error);
  const { title, text } = describe(status);

  const retry = () => {
    if (reset) {
      reset();

      return;
    }

    window.location.reload();
  };

  return (
    <main className="status-page">
      <p className="eyebrow">
        <b>{status ?? "Error"}</b>
      </p>
      <h1>{title}</h1>
      <p className="lead">{text}</p>
      <div className="actions">
        {status === 401 ? (
          <Link className="btn btn-red" to="/admin/sign-in">
            Sign in
          </Link>
        ) : (
          <button className="btn btn-red" type="button" onClick={retry}>
            Try again
          </button>
        )}
        <Link className="btn btn-ghost" to="/">
          Home page
        </Link>
      </div>
    </main>
  );
}

interface RootErrorComponentProps {
  error: unknown;
  reset?: () => void;
}
