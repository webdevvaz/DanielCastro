/**
 * Runs a local PostgreSQL cluster for development, without containers or a system service:
 *
 *   pnpm db:local start    creates the cluster on first use, starts it, creates the database
 *   pnpm db:local stop     stops it
 *   pnpm db:local status   reports whether it runs
 *
 * The cluster lives in `.data/postgres`. The port and database name come from `DATABASE_URL`.
 * The PostgreSQL programs come from `PG_BIN`, or from PATH when it is not set.
 */
import { config } from "dotenv";
import { execFile, spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

config({ path: [join(rootDir, ".env.local"), join(rootDir, ".env")], quiet: true });

const dataDir = join(rootDir, ".data", "postgres");
const logFile = join(rootDir, ".data", "postgres.log");

const program = (name: string) => (process.env.PG_BIN ? join(process.env.PG_BIN, name) : name);

const databaseUrl = new URL(
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/daniel",
);
const port = databaseUrl.port === "" ? "5432" : databaseUrl.port;
const user = decodeURIComponent(databaseUrl.username) || "postgres";
const database = databaseUrl.pathname.slice(1);

async function isRunning() {
  try {
    await run(program("pg_ctl"), ["status", "-D", dataDir]);

    return true;
  } catch {
    return false;
  }
}

/**
 * Starts the server and waits until it accepts connections. The server would inherit captured
 * output pipes and keep them open, so this command would never end; it gets no pipes instead.
 */
function startServer() {
  return new Promise<void>((resolvePromise, reject) => {
    const child = spawn(
      program("pg_ctl"),
      ["start", "-D", dataDir, "-l", logFile, "-w", "-o", `-p ${port} -h 127.0.0.1`],
      { stdio: "ignore", detached: true, windowsHide: true },
    );

    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolvePromise()
        : reject(new Error(`pg_ctl start exited with code ${code}. See ${logFile}.`)),
    );
  });
}

async function start() {
  if (!existsSync(join(dataDir, "PG_VERSION"))) {
    mkdirSync(dataDir, { recursive: true });

    // Trust authentication: the cluster only listens on localhost and holds development data.
    await run(program("initdb"), [
      "-D",
      dataDir,
      "-U",
      user,
      "--auth=trust",
      "--encoding=UTF8",
      "--no-locale",
    ]);
    console.log(`Created a PostgreSQL cluster in ${dataDir}`);
  }

  if (await isRunning()) {
    console.log("PostgreSQL is already running.");
  } else {
    await startServer();
    console.log(`PostgreSQL is running on port ${port}. Log: ${logFile}`);
  }

  const { stdout } = await run(program("psql"), [
    "-h",
    "127.0.0.1",
    "-p",
    port,
    "-U",
    user,
    "-d",
    "postgres",
    "-tAc",
    `SELECT 1 FROM pg_database WHERE datname = '${database}'`,
  ]);

  if (stdout.trim() !== "1") {
    await run(program("createdb"), ["-h", "127.0.0.1", "-p", port, "-U", user, database]);
    console.log(`Created the database "${database}". Run pnpm db:migrate next.`);
  }
}

async function stop() {
  if (!(await isRunning())) {
    console.log("PostgreSQL is not running.");

    return;
  }

  await run(program("pg_ctl"), ["stop", "-D", dataDir, "-m", "fast", "-w"]);
  console.log("PostgreSQL stopped.");
}

const command = process.argv.at(2);

if (command === "start") await start();
else if (command === "stop") await stop();
else if (command === "status")
  console.log((await isRunning()) ? "PostgreSQL is running." : "PostgreSQL is not running.");
else {
  console.error("Usage: pnpm db:local start | stop | status");
  process.exitCode = 1;
}
