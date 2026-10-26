# Security model

What must protect the app, where it lives, and what to check when you add to it.

## Authentication

- **Better Auth sessions** in HTTP-only cookies, stored in PostgreSQL, so banning a user ends their sessions immediately.
- **Startup checks:** the server refuses to start with a `BETTER_AUTH_SECRET` shorter than 32 characters.
- **Endpoints:** Better Auth exposes many HTTP endpoints under `/api/auth`. Allow only the ones the browser needs (sign-in, callbacks, sign-out, session reads) and answer 404 for every other one, so users cannot skip the app's permission checks and audit events. The server still calls the other APIs through `auth.call`. Keep a unit test that sends a request to every endpoint and expects 404 for each one that is not allowed.

## Authorization

Every non-public server function goes through middleware in `apps/web/src/server/`:

| Layer                     | Check                                                            |
| ------------------------- | ---------------------------------------------------------------- |
| `authenticatedMiddleware` | A valid session; otherwise a redirect to the sign-in page        |
| Role middleware           | The user's role allows the area; otherwise 403                   |
| Tenant middleware         | The user's membership row in the session's tenant; otherwise 403 |
| Permissions               | Checked in the server program against the role's statement       |

Tenant rule: a tenant-scoped function uses the tenant ID from the membership row, never an ID or slug from the request. Queries filter by that ID.

Request rule: server programs read request headers (and so the session) from the `RequestHeaders` service. Never call `getRequestHeaders()` or the other request helpers from `@tanstack/react-start/server` inside a program. Lint rejects them in `apps/web/src/server/**`.

A route redirect is only navigation. The server functions check the role again.

Return paths after sign-in come from the URL: accept only a path inside this app (refuse `//host`, `/\host`, full URLs, and control characters) and drop an invalid value.

## Requests

- **CSRF:** server-function calls must come from the app's own origin (request middleware in `start.ts`). Better Auth checks the origin of its own endpoints against `BETTER_AUTH_URL` and `trustedOrigins`.
- **Headers:** set `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin` on every response, plus `Strict-Transport-Security` in production.
- **Rate limits:** Better Auth limits auth requests per client IP. Behind a proxy, set `AUTH_IP_ADDRESS_HEADER`, or all users share one limit.
- **Server routes** (`apps/web/src/routes/api/`) are outside the server-function middleware and its CSRF check. Each one checks the session and role itself. An OAuth callback, such as `/api/instagram/callback`, also requires the `state` value from an HTTP-only cookie that its start route set (see `docs/instagram.md`).
- **Outgoing requests:** when a service takes a key or token in the address (SerpApi, Instagram), turn tracing off for its requests (`HttpClient.TracerDisabledWhen`) and keep only `describeHttpFailure(error)` in errors, because traces and error messages record addresses. Fetch user-influenced addresses only from an allowed list of hosts over HTTPS.

## Input and output

- **Validation:** every server function decodes its input with an Effect schema through `validateInput`. Schemas bound lengths and formats (IDs, slugs, text sizes).
- **Errors:** only `AppError` classes reach the browser, with a status and a safe message. Anything else becomes a generic 500; the details go to the server log.
- **Uploads:** check size and the file's magic bytes, not the name. Derive storage keys from the owner, so a path cannot reach another user's files.

## Audit

Wrap administrative changes with `withAuditEvent` to emit an audit log record and span (who, what, target, outcome). See `docs/observability.md`.

## Checklist for a new server function

1. Choose the middleware. Use no middleware only for data that is public by design.
2. Validate the input with `validateInput(Schema)`, and bound every string and array.
3. Check the permission, and filter queries by the tenant from the membership row.
4. Fail with an `AppError`, so the status and message are safe.
5. Wrap mutations with `withAuditEvent`.
6. Add an authorization test in `apps/web/tests/integration/` (see `docs/testing.md`).

## Add when needed

- A Content-Security-Policy.
- Rate-limit storage shared between replicas.
- Multi-factor authentication (Better Auth `twoFactor` plugin).
- Rate limits for your own server functions.
