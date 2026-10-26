import "@tanstack/react-start/server-only";
import { Config, Effect, Layer, Logger, Option, References } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { Otlp } from "effect/unstable/observability";

const LOG_FORMATS = ["pretty", "json", "logfmt"] as const;

const DEFAULT_SERVICE_NAME = "daniel";

const loggers = {
  pretty: Logger.consolePretty(),
  json: Logger.consoleJson,
  logfmt: Logger.consoleLogFmt,
} satisfies Record<LogFormat, Logger.Logger<unknown, void>>;

/** Parses `OTEL_EXPORTER_OTLP_HEADERS` (`key=value,key2=value2`), the OpenTelemetry format. */
const parseOtlpHeaders = (value: string) => {
  const entries = value.split(",").flatMap((pair): Array<[string, string]> => {
    const separator = pair.indexOf("=");

    if (separator <= 0) return [];

    return [
      [pair.slice(0, separator).trim(), decodeURIComponent(pair.slice(separator + 1).trim())],
    ];
  });

  return Object.fromEntries(entries);
};

/**
 * Observability settings from the environment:
 *
 * - `LOG_FORMAT`: `pretty` (colored terminal output), `json`, or `logfmt`. Defaults to `json`
 *   when `NODE_ENV=production` and `pretty` otherwise.
 * - `LOG_LEVEL`: the minimum level, for example `Debug` or `Warn`. Defaults to `Info`.
 * - `OTEL_EXPORTER_OTLP_ENDPOINT`: an OTLP/HTTP collector base URL. When set, logs, traces, and
 *   metrics are also exported to `/v1/logs`, `/v1/traces`, and `/v1/metrics` below it.
 * - `OTEL_EXPORTER_OTLP_HEADERS`: optional collector headers, for example an API key.
 * - `OTEL_SERVICE_NAME`: the service name on exported telemetry.
 * - `OTEL_SDK_DISABLED=true` turns the export off without removing the endpoint.
 */
const ObservabilityConfig = Config.all({
  logFormat: Config.Literals(LOG_FORMATS, "LOG_FORMAT").pipe(
    Config.withDefault(process.env.NODE_ENV === "production" ? "json" : "pretty"),
  ),
  logLevel: Config.LogLevel("LOG_LEVEL").pipe(Config.withDefault("Info")),
  otlpEndpoint: Config.option(Config.URL("OTEL_EXPORTER_OTLP_ENDPOINT")),
  otlpHeaders: Config.String("OTEL_EXPORTER_OTLP_HEADERS").pipe(Config.withDefault("")),
  otlpDisabled: Config.Boolean("OTEL_SDK_DISABLED").pipe(Config.withDefault(false)),
  serviceName: Config.String("OTEL_SERVICE_NAME").pipe(Config.withDefault(DEFAULT_SERVICE_NAME)),
  serviceVersion: Config.option(Config.String("OTEL_SERVICE_VERSION")),
});

/**
 * Installs the terminal logger selected by `LOG_FORMAT`, the minimum log level, and, when an
 * OTLP endpoint is configured, the OpenTelemetry exporter for logs, traces, and metrics. The
 * exporter is added next to the terminal logger, so local output never disappears.
 *
 * Every `Effect.fn` becomes a span and every `Effect.log*` call becomes a log record, so server
 * programs need no extra code to show up in a tracing backend.
 */
export const ObservabilityLive = Layer.unwrap(
  Effect.gen(function* () {
    const config = yield* ObservabilityConfig;

    const terminal = Layer.mergeAll(
      Logger.layer([loggers[config.logFormat]]),
      Layer.succeed(References.MinimumLogLevel, config.logLevel),
    );

    if (config.otlpDisabled || Option.isNone(config.otlpEndpoint)) return terminal;

    const exporter = Otlp.layerJson({
      baseUrl: config.otlpEndpoint.value.toString(),
      headers: parseOtlpHeaders(config.otlpHeaders),
      resource: {
        serviceName: config.serviceName,
        serviceVersion: Option.getOrUndefined(config.serviceVersion),
      },
      loggerMergeWithExisting: true,
    });

    return exporter.pipe(Layer.provide(FetchHttpClient.layer), Layer.provideMerge(terminal));
  }),
);

type LogFormat = (typeof LOG_FORMATS)[number];
