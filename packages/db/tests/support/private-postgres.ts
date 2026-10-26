import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Context, Effect, Layer, Predicate, Redacted, Schedule, Schema } from "effect";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { layer as databaseLayer } from "../../src/database";

const migrationsFolder = resolve(dirname(fileURLToPath(import.meta.url)), "../../drizzle");

const DATABASE_NAME = "daniel_test";

/** A PostgreSQL program from `PG_BIN` (see `.env.example`), or from PATH when it is not set. */
const program = (name: string) => (process.env.PG_BIN ? join(process.env.PG_BIN, name) : name);

class PrivatePostgresError extends Schema.TaggedError<PrivatePostgresError>()(
  "PrivatePostgresError",
  { step: Schema.String, cause: Schema.Defect() },
) {}

function run(command: string, args: ReadonlyArray<string>) {
  return Effect.callback<void, PrivatePostgresError>((resume) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    const output: Array<Buffer> = [];

    child.stdout.on("data", (chunk: Buffer) => output.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => output.push(chunk));
    child.once("error", (cause) =>
      resume(Effect.fail(new PrivatePostgresError({ step: command, cause }))),
    );
    child.once("exit", (code) =>
      resume(
        code === 0
          ? Effect.void
          : Effect.fail(
              new PrivatePostgresError({
                step: command,
                cause: `exited ${code}:\n${Buffer.concat(output).toString()}`,
              }),
            ),
      ),
    );
  });
}

/**
 * Stops the cluster with `pg_ctl`, which works on every platform: on Windows, killing the
 * server process would end it without closing its files, and the data directory could not be
 * removed.
 */
function stop(server: ChildProcess, dataDirectory: string) {
  const exited = Effect.callback<void>((resume) => {
    if (server.exitCode !== null) return resume(Effect.void);

    server.once("exit", () => resume(Effect.void));
  });

  return run(program("pg_ctl"), ["stop", "-D", dataDirectory, "-m", "fast", "-w"]).pipe(
    Effect.ignore,
    Effect.andThen(exited),
  );
}

/** Asks the OS for an unused loopback port. */
const freePort = Effect.callback<number, PrivatePostgresError>((resume) => {
  const server = createServer();

  server.once("error", (cause) =>
    resume(Effect.fail(new PrivatePostgresError({ step: "port", cause }))),
  );
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    const port = address !== null && Predicate.hasProperty(address, "port") ? address.port : 0;

    server.close(() => resume(Effect.succeed(port)));
  });
});

/**
 * Starts a throwaway PostgreSQL cluster in a temporary directory, applies the committed
 * migrations, and removes everything when the scope closes. Requires `initdb`, `postgres`, and
 * `pg_ctl` from `PG_BIN` or PATH. It never touches a developer database.
 */
const privatePostgres = Effect.acquireRelease(
  Effect.gen(function* () {
    const root = yield* Effect.promise(() => mkdtemp(join(tmpdir(), "daniel-pg-")));
    const dataDirectory = join(root, "data");
    const port = yield* freePort;

    yield* run(program("initdb"), [
      "-D",
      dataDirectory,
      "-U",
      "postgres",
      "--auth=trust",
      "--no-sync",
      "--encoding=UTF8",
      "--no-locale",
    ]);

    const server = spawn(
      program("postgres"),
      ["-D", dataDirectory, "-k", root, "-p", String(port), "-h", "127.0.0.1", "-c", "fsync=off"],
      { stdio: "ignore", windowsHide: true },
    );

    const adminUrl = `postgresql://postgres@127.0.0.1:${port}/postgres`;
    const url = `postgresql://postgres@127.0.0.1:${port}/${DATABASE_NAME}`;

    yield* Effect.tryPromise(async () => {
      const admin = drizzle(adminUrl);

      await admin.$client.query(`CREATE DATABASE ${DATABASE_NAME}`);
      await admin.$client.end();
    }).pipe(Effect.retry({ times: 100, schedule: Schedule.spaced("100 millis") }));

    yield* Effect.tryPromise(async () => {
      const client = drizzle(url);

      await migrate(client, { migrationsFolder });
      await client.$client.end();
    });

    return { root, dataDirectory, server, url };
  }),
  ({ root, dataDirectory, server }) =>
    stop(server, dataDirectory).pipe(
      Effect.andThen(Effect.promise(() => rm(root, { recursive: true, force: true }))),
    ),
);

/**
 * The connection URL of the private test cluster. It sits among the private values because the
 * layer below reads it when the module loads.
 */
export class TestDatabaseUrl extends Context.Service<TestDatabaseUrl, string>()(
  "@daniel/db/tests/TestDatabaseUrl",
) {}

const PrivatePostgresLive = Layer.effect(
  TestDatabaseUrl,
  Effect.map(privatePostgres, ({ url }) => url),
);

/**
 * Provides `Database` backed by a private, migrated PostgreSQL cluster, and its URL as
 * `TestDatabaseUrl` for services that open their own connections (such as Better Auth).
 */
export const TestDatabaseLive = Layer.unwrap(
  Effect.gen(function* () {
    const url = yield* TestDatabaseUrl;

    return databaseLayer({ url: Redacted.make(url), maxConnections: 4 });
  }),
).pipe(Layer.provideMerge(PrivatePostgresLive));
