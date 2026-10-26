import { defineRelationsPart, sql } from "drizzle-orm";
import { check, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

/** The ID of the only Instagram connection row. */
export const INSTAGRAM_CONNECTION_ID = 1;

/**
 * Daniel's Instagram account, connected once by an admin through Instagram Login. The table has at
 * most one row. `accessToken` is a long-lived token (60 days) that the site renews; it never
 * leaves the server.
 */
export const instagramConnection = pgTable(
  "instagram_connection",
  {
    id: integer("id").primaryKey().default(INSTAGRAM_CONNECTION_ID),
    instagramUserId: text("instagram_user_id").notNull(),
    username: text("username").notNull(),
    accessToken: text("access_token").notNull(),
    tokenExpiresAt: timestamp("token_expires_at").notNull(),
    tokenRefreshedAt: timestamp("token_refreshed_at").defaultNow().notNull(),
    connectedBy: text("connected_by").references(() => user.id, { onDelete: "set null" }),
    connectedAt: timestamp("connected_at").defaultNow().notNull(),
  },
  (table) => [
    check(
      "instagram_connection_single_row",
      sql`${table.id} = ${sql.raw(String(INSTAGRAM_CONNECTION_ID))}`,
    ),
  ],
);

/** Registers the Instagram connection table with the relational query API. It has no relations. */
export const instagramRelations = defineRelationsPart({ instagramConnection });
