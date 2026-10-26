import { isAppError, type AppError } from "@daniel/shared/errors";
import { Effect, Schema } from "effect";

/**
 * A failed database operation. The query error stays in `cause` for logs; callers only branch
 * on the operation name. Map it to an `AppError` at the server boundary when needed.
 */
export class DatabaseError extends Schema.TaggedError<DatabaseError>()("DatabaseError", {
  operation: Schema.String,
  cause: Schema.Defect(),
}) {}

/**
 * Wraps driver failures in `DatabaseError` tagged with the operation name. Expected domain
 * failures (`AppError`) pass through unchanged so the server boundary can map their status.
 */
export const mapDatabaseError =
  (operation: string) =>
  <A, E, R>(
    effect: Effect.Effect<A, E, R>,
  ): Effect.Effect<A, Extract<E, AppError> | DatabaseError, R> =>
    Effect.mapError(effect, (cause): Extract<E, AppError> | DatabaseError =>
      // SAFETY: `isAppError` proved `cause` is an AppError, and `cause` is an `E`.
      isAppError(cause) ? (cause as Extract<E, AppError>) : new DatabaseError({ operation, cause }),
    );
