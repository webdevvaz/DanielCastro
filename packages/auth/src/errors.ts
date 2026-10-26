import {
  AccessDeniedError,
  ConflictError,
  InvalidInputError,
  NotFoundError,
  UnauthenticatedError,
  type AppError,
} from "@daniel/shared/errors";
import { APIError } from "better-auth/api";
import { Schema } from "effect";

/** A Better Auth failure that does not map to an expected `AppError`. */
export class AuthError extends Schema.TaggedError<AuthError>()("AuthError", {
  operation: Schema.String,
  cause: Schema.Defect(),
}) {}

/** Maps Better Auth API errors to the shared expected errors by HTTP status. */
export function toAuthFailure(operation: string, cause: unknown): AppError | AuthError {
  if (!(cause instanceof APIError)) return new AuthError({ operation, cause });

  const reason = cause.body?.message ?? cause.message;

  switch (cause.statusCode) {
    case 400:
    case 422:
      return new InvalidInputError({ reason });
    case 401:
      return new UnauthenticatedError();
    case 403:
      return new AccessDeniedError();
    case 404:
      return new NotFoundError({ resource: "Resource" });
    case 409:
      return new ConflictError({ reason });
    default:
      return new AuthError({ operation, cause });
  }
}
