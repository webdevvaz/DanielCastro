import { PgClient } from "@effect/sql-pg";
import * as PgDrizzle from "drizzle-orm/effect-postgres";
import { Config, Context, Layer } from "effect";

import "./env";
import { relations } from "./relations";

const makeClient = PgDrizzle.makeWithDefaults({ relations });

/** The application database. Every query in this package reads it from the Effect context. */
export class Database extends Context.Service<Database, DatabaseClient>()("@daniel/db/Database") {}

/** Builds the database from an explicit Postgres pool configuration. */
export const layer = (config: PgClient.PgPoolConfig) =>
  Layer.effect(Database, makeClient).pipe(Layer.provide(PgClient.layer(config)));

/** Builds the database from `DATABASE_URL`. */
export const layerFromConfig = Layer.effect(Database, makeClient).pipe(
  Layer.provide(PgClient.layerConfig({ url: Config.Redacted("DATABASE_URL") })),
);

/** The Effect Drizzle client with every relation registered. */
export type DatabaseClient = PgDrizzle.EffectPgDatabase<typeof relations>;
