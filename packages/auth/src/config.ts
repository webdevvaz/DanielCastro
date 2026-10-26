import { Config, Schema } from "effect";

const MIN_SECRET_LENGTH = 32;

/** Rejects short secrets, including an empty value copied from `.env.example`. */
const AuthSecret = Schema.Redacted(
  Schema.String.check(
    Schema.isMinLength(MIN_SECRET_LENGTH, {
      message: `BETTER_AUTH_SECRET must have at least ${MIN_SECRET_LENGTH} characters. Generate one with: openssl rand -base64 32`,
    }),
  ),
);

/** Server settings for Better Auth, read from the environment. */
export const AuthConfig = Config.all({
  secret: Config.schema(AuthSecret, "BETTER_AUTH_SECRET"),
  baseUrl: Config.String("BETTER_AUTH_URL"),
  databaseUrl: Config.Redacted("DATABASE_URL"),
  /** The header that holds the client IP behind a proxy, for example `x-forwarded-for`. */
  ipAddressHeader: Config.option(Config.String("AUTH_IP_ADDRESS_HEADER")),
  nodeEnv: Config.String("NODE_ENV").pipe(Config.withDefault("development")),
});

/** Parsed Better Auth server settings. */
export type AuthConfig = Config.Success<typeof AuthConfig>;
