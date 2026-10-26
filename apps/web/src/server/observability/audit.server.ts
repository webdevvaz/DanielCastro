import "@tanstack/react-start/server-only";
import { Cause, Effect, Exit, Option, Predicate } from "effect";

const AUDIT_ACTIONS = [
  "gallery.photo_uploaded",
  "gallery.photo_updated",
  "gallery.photo_deleted",
  "gallery.reordered",
  "gallery.photo_imported",
  "guest_spot.created",
  "guest_spot.updated",
  "guest_spot.deleted",
  "travel.settings_updated",
  "instagram.connected",
  "instagram.disconnected",
] as const;

/** The `_tag` of the typed failure, or "defect" when the effect died. */
const failureTag = (cause: Cause.Cause<unknown>) =>
  Cause.findErrorOption(cause).pipe(
    Option.map((error) => (Predicate.hasProperty(error, "_tag") ? String(error._tag) : "failure")),
    Option.getOrElse(() => "defect"),
  );

/** Drops unset fields, so logs and spans carry no `undefined` attributes. */
const definedEntries = (record: Record<string, string | undefined>) =>
  Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));

/**
 * Wraps a mutation in an `audit.<action>` span and logs its outcome as a structured audit
 * event. The event carries `audit.*` annotations (action, outcome, actor, target, failure tag)
 * and the duration, so it can be filtered in the terminal output or in any OpenTelemetry
 * backend. Success logs at Info; failure logs at Warn with the error `_tag`.
 *
 * Logging never changes the result of the mutation.
 */
export const withAuditEvent =
  (event: AuditEvent) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>) => {
    const annotations = definedEntries({
      "audit.action": event.action,
      "audit.actor_id": event.actorUserId,
      "audit.target_type": event.targetType,
      "audit.target_id": event.targetId,
    });

    return effect.pipe(
      Effect.onExit((exit) =>
        Exit.isSuccess(exit)
          ? Effect.logInfo(`${event.action} succeeded`).pipe(
              Effect.annotateLogs("audit.outcome", "succeeded"),
            )
          : Effect.logWarning(`${event.action} failed`).pipe(
              Effect.annotateLogs({
                "audit.outcome": "failed",
                "audit.failure": failureTag(exit.cause),
              }),
            ),
      ),
      Effect.annotateLogs(annotations),
      Effect.withLogSpan(event.action),
      Effect.withSpan(`audit.${event.action}`, { attributes: annotations }),
    );
  };

/**
 * Audited actions. Add a value when you wrap a new mutation with `withAuditEvent`, so audit
 * events stay searchable by a known set of names.
 */
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/** What an audit event records about a mutation. */
export type AuditEvent = {
  readonly action: AuditAction;
  readonly actorUserId: string;
  readonly targetType:
    | "gallery"
    | "gallery_photo"
    | "guest_spot"
    | "travel_settings"
    | "instagram_connection"
    | "instagram_post";
  readonly targetId?: string | undefined;
};
