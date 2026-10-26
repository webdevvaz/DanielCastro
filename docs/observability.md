# Observability

The server writes structured logs, traces, and metrics through Effect. It prints them to the terminal and can export them to any OpenTelemetry (OTLP/HTTP) collector. Audit events use the same pipeline; they are not stored in the database.

Put the setup in `apps/web/src/server/observability/`:

| File                      | Purpose                                                                       |
| ------------------------- | ----------------------------------------------------------------------------- |
| `observability.server.ts` | `ObservabilityLive`: terminal logger, minimum log level, optional OTLP export |
| `audit.server.ts`         | `withAuditEvent`: an audit span and log event for a mutation                  |

`ObservabilityLive` is part of `AppLive` in `apps/web/src/server/runtime.server.ts`, so every server function, auth hook, and background job uses it.

## Settings

| Variable                      | Default                                        | Effect                                                                                      |
| ----------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `LOG_FORMAT`                  | `pretty`, or `json` when `NODE_ENV=production` | `pretty`, `json` (one object per line), or `logfmt`                                         |
| `LOG_LEVEL`                   | `Info`                                         | `All`, `Trace`, `Debug`, `Info`, `Warn`, `Error`, `Fatal`, `None`                           |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | unset                                          | Collector base URL; logs, traces, and metrics go to `/v1/logs`, `/v1/traces`, `/v1/metrics` |
| `OTEL_EXPORTER_OTLP_HEADERS`  | unset                                          | Collector headers: `api-key=abc,x-tenant=web`                                               |
| `OTEL_SERVICE_NAME`           | the project slug                               | `service.name` on exported telemetry                                                        |

## Local collector

`compose.yaml` includes `grafana/otel-lgtm` (OpenTelemetry Collector, Loki, Tempo, Prometheus, and Grafana):

```bash
podman compose up -d telemetry
```

Set `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318` in `.env.local`, restart `pnpm dev`, and open Grafana at http://localhost:3001.

## What is recorded

- **Spans.** Every `Effect.fn("name")` creates a span with that name, so each server program, database query (`db.*`), and auth call is a span. Wrap an ad hoc effect with `Effect.withSpan("name")`.
- **Logs.** Every `Effect.logDebug`/`logInfo`/`logWarning`/`logError` call becomes a log record with the current span and trace IDs. Add context with `Effect.annotateLogs({ key: value })`.
- **Unexpected failures.** `runServerEffect` logs every failure that is not an `AppError` at Error level with its full cause, then returns a generic 500.

Do not use `console.log` in server code. It skips the log level, the format, and the exporter.

## Audit events

Wrap a mutation with `withAuditEvent` to record who did what:

```ts
/** Archives a report and records an audit event. */
export const archiveReport = Effect.fn("reports.archive")(function* (
  actorUserId: string,
  reportId: string,
) {
  return yield* archiveReportInDb(reportId).pipe(
    withAuditEvent({
      action: "report.archived",
      actorUserId,
      targetType: "report",
      targetId: reportId,
    }),
  );
});
```

Each audited mutation produces a span named `audit.<action>` and one log record (`<action> succeeded` at Info, or `<action> failed` at Warn) with `audit.action`, `audit.outcome`, `audit.actor_id`, `audit.target_type`, `audit.target_id`, and `audit.failure` annotations. Keep the action names in an `AuditAction` union in `audit.server.ts`.
