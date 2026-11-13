import { GALLERY_SECTIONS } from "@daniel/shared/gallery";
import { defineRelationsPart, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

// The section is text with a check rather than a Postgres enum: the driver reads results in the
// binary format and returns a user-defined type, such as an enum, as raw bytes.
const sectionList = sql.raw(GALLERY_SECTIONS.map((section) => `'${section}'`).join(", "));

/**
 * Photos of the site: Daniel's work and the studio, each `section` in its own order. `storageKey`
 * names the stored files; the web app derives the file of each size from it. Lower `position`
 * comes first within a section.
 */
export const galleryPhoto = pgTable(
  "gallery_photo",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storageKey: text("storage_key").notNull().unique(),
    section: text("section", { enum: GALLERY_SECTIONS }).default("work").notNull(),
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
  (table) => [
    // Repeats the input schema; it protects writes that bypass it.
    check("gallery_photo_section_check", sql`${table.section} in (${sectionList})`),
    index("gallery_photo_section_position_idx").on(table.section, table.position),
  ],
);

/** Relations of the gallery tables. */
export const galleryRelations = defineRelationsPart({ galleryPhoto, user }, (r) => ({
  galleryPhoto: {
    creator: r.one.user({ from: r.galleryPhoto.createdBy, to: r.user.id }),
  },
}));
