import { layerFromConfig as DatabaseLive } from "@daniel/db";
import { NodeRuntime } from "@effect/platform-node";
import { APIError } from "better-auth/api";
import { Config, Console, Effect, Layer, Redacted, Schema } from "effect";

import { Auth, layer as AuthLive } from "../service";

const MIN_PASSWORD_LENGTH = 12;

const DUPLICATE_USER_CODE = "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL";

const SeedConfig = Config.all({
  emails: Config.String("ADMIN_EMAILS"),
  password: Config.schema(
    Schema.Redacted(
      Schema.String.check(
        Schema.isMinLength(MIN_PASSWORD_LENGTH, {
          message: `ADMIN_INITIAL_PASSWORD must have at least ${MIN_PASSWORD_LENGTH} characters`,
        }),
      ),
    ),
    "ADMIN_INITIAL_PASSWORD",
  ),
});

class SeedAdminError extends Schema.TaggedError<SeedAdminError>()("SeedAdminError", {
  email: Schema.String,
  cause: Schema.Defect(),
}) {}

/** Comma-separated emails, trimmed and lowercased, without empty entries. */
const parseEmails = (value: string) =>
  value
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email !== "");

const createAdmin = Effect.fn("seed.createAdmin")(function* (email: string, password: string) {
  const auth = yield* Auth;

  // The part before the @ is a starting display name; it can be changed later.
  const name = email.split("@").at(0) ?? email;

  return yield* Effect.tryPromise({
    try: () => auth.instance.api.createUser({ body: { email, name, password, role: "admin" } }),
    catch: (cause) => new SeedAdminError({ email, cause }),
  }).pipe(
    Effect.as("created" as const),
    Effect.catchIf(
      (error) => error.cause instanceof APIError && error.cause.body?.code === DUPLICATE_USER_CODE,
      () => Effect.succeed("skipped" as const),
    ),
  );
});

/**
 * Creates the admin accounts listed in `ADMIN_EMAILS` with the password in
 * `ADMIN_INITIAL_PASSWORD` (`pnpm db:seed-admins`). Existing accounts are skipped, so it is safe
 * to run again.
 */
const seedAdmins = Effect.gen(function* () {
  const config = yield* SeedConfig;

  const emails = parseEmails(config.emails);

  if (emails.length === 0) {
    return yield* Console.error("ADMIN_EMAILS is empty. Add the admin emails to .env.local.");
  }

  const password = Redacted.value(config.password);

  const results = yield* Effect.forEach(emails, (email) =>
    createAdmin(email, password).pipe(Effect.map((result) => ({ email, result }))),
  );

  yield* Effect.forEach(results, ({ email, result }) =>
    Console.log(result === "created" ? `Created ${email}` : `Skipped ${email}: it exists`),
  );
});

NodeRuntime.runMain(
  seedAdmins.pipe(Effect.provide(AuthLive.pipe(Layer.provideMerge(DatabaseLive)))),
);
