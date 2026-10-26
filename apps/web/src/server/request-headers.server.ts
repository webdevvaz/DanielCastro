import "@tanstack/react-start/server-only";
import { Context } from "effect";

/**
 * The headers of the request a server program is running for, including the session cookie.
 *
 * Server programs must read request data from this service, never from `getRequestHeaders()`
 * from `@tanstack/react-start/server`. That function reads Node's async context, and Effect
 * fibers resume on a shared scheduler whose async context can belong to another request: a
 * program could see another user's cookies. `runServerEffect` captures the headers at the
 * server-function boundary, where the context is still correct, and provides them here.
 */
export class RequestHeaders extends Context.Service<RequestHeaders, Headers>()(
  "web/RequestHeaders",
) {}
