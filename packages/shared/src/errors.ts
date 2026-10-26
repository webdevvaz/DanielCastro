import { Schema } from "effect";

/** One schema problem: the path of the invalid field (empty for the whole input) and why. */
const InputIssue = Schema.Struct({
  path: Schema.Array(Schema.String),
  message: Schema.String,
});

/** The request has no signed-in session. */
export class UnauthenticatedError extends Schema.TaggedError<UnauthenticatedError>()(
  "UnauthenticatedError",
  {},
) {
  readonly status = 401;

  override get message() {
    return "You must sign in to continue";
  }
}

/** The signed-in user lacks the role or membership the action requires. */
export class AccessDeniedError extends Schema.TaggedError<AccessDeniedError>()(
  "AccessDeniedError",
  {},
) {
  readonly status = 403;

  override get message() {
    return "You are not allowed to perform this action";
  }
}

/** The named resource does not exist or is outside the caller's scope. */
export class NotFoundError extends Schema.TaggedError<NotFoundError>()("NotFoundError", {
  resource: Schema.String,
}) {
  readonly status = 404;

  override get message() {
    return `${this.resource} not found`;
  }
}

/** The action conflicts with the current state; `reason` is shown to the user. */
export class ConflictError extends Schema.TaggedError<ConflictError>()("ConflictError", {
  reason: Schema.String,
}) {
  readonly status = 409;

  override get message() {
    return this.reason;
  }
}

/**
 * The input is malformed or breaks a business rule; `reason` is shown to the user. Schema
 * validation failures also list each problem in `issues`, with the path of the invalid field.
 */
export class InvalidInputError extends Schema.TaggedError<InvalidInputError>()(
  "InvalidInputError",
  { reason: Schema.String, issues: Schema.optional(Schema.Array(InputIssue)) },
) {
  readonly status = 422;

  override get message() {
    return this.reason;
  }
}

/** A dependency the action needs, named by `service`, is unavailable. */
export class ServiceUnavailableError extends Schema.TaggedError<ServiceUnavailableError>()(
  "ServiceUnavailableError",
  { service: Schema.String },
) {
  readonly status = 503;

  override get message() {
    return `${this.service} is unavailable`;
  }
}

/**
 * Expected failures that cross the server-function boundary. Each error carries the HTTP
 * status that the boundary sets on the response. Add new errors here and above.
 */
export const AppError = Schema.Union([
  UnauthenticatedError,
  AccessDeniedError,
  NotFoundError,
  ConflictError,
  InvalidInputError,
  ServiceUnavailableError,
]);

/** Reports whether a value is one of the expected `AppError` failures. */
export const isAppError = Schema.is(AppError);

/** Any expected failure that crosses the server-function boundary. */
export type AppError = typeof AppError.Type;
