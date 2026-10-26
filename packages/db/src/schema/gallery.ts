import { defineRelationsPart } from "drizzle-orm";
import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";

/**
 * Photos in the public gallery. `storageKey` names the stored files; the web app derives the
 * file of each size from it. Lower `position` comes first.
 */
export const galleryPhoto = pgTable(
  "gallery_photo",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storageKey: text("storage_key").notNull().unique(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    title: text("title"),
    series: text("series"),
    placement: text("placement"),
    position: integer("position").notNull(),
    featured: boolean("featured").default(false).notNull(),
    hidden: boolean("hidden").default(false).notNull(),
    // The Instagram post the photo came from; one photo per post.
    instagramMediaId: text("instagram_media_id").unique(),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("gallery_photo_position_idx").on(table.position)],
);

/** Relations of the gallery tables. */
export const galleryRelations = defineRelationsPart({ galleryPhoto, user }, (r) => ({
  galleryPhoto: {
    creator: r.one.user({ from: r.galleryPhoto.createdBy, to: r.user.id }),
  },
}));
