import { Link } from "@tanstack/react-router";

/** Shown when no route matches the URL. */
export function NotFoundComponent() {
  return (
    <main className="status-page">
      <p className="eyebrow">
        <b>404</b>
      </p>
      <h1>Page not found</h1>
      <p className="lead">This page does not exist. Check the address, or go back home.</p>
      <div className="actions">
        <Link className="btn btn-red" to="/">
          Home page
        </Link>
      </div>
    </main>
  );
}
