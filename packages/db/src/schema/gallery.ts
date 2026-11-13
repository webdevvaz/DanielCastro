import { GALLERY_SECTIONS, GALLERY_TAG_KINDS } from "@daniel/shared/gallery";
import { defineRelationsPart, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

// The section is text with a check rather than a Postgres enum: the driver reads results in the
// binary format and returns a user-defined type, such as an enum, as raw bytes.
const sectionList = sql.raw(GALLERY_SECTIONS.map((section) => `'${section}'`).join(", "));

const tagKindList = sql.raw(GALLERY_TAG_KINDS.map((kind) => `'${kind}'`).join(", "));

/**
 * The themes and series that visitors filter Daniel's work by. Admins add, rename, order, and
 * delete them. `name` shows in every language without its own translation in `name_<locale>`.
 * Lower `position` comes first within a kind.
 */
export const galleryTag = pgTable(
  "gallery_tag",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind", { enum: GALLERY_TAG_KINDS }).notNull(),
    name: text("name").notNull(),
    nameEn: text("name_en"),
    namePt: text("name_pt"),
    nameFr: text("name_fr"),
    nameDe: text("name_de"),
    nameEs: text("name_es"),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    // Repeats the input schema; it protects writes that bypass it.
    check("gallery_tag_kind_check", sql`${table.kind} in (${tagKindList})`),
    // Two themes, or two series, with names that differ only in case would confuse visitors.
    uniqueIndex("gallery_tag_kind_name_idx").on(table.kind, sql`lower(${table.name})`),
  ],
);

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
    // A tag of kind `series`; the server checks the kind before it saves the link.
    seriesId: uuid("series_id").references(() => galleryTag.id, { onDelete: "set null" }),
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
    index("gallery_photo_series_idx").on(table.seriesId),
  ],
);

/**
 * The themes of each photo. The tags are of kind `theme`; the server checks the kind before it
 * saves a link. Deleting a photo or a theme deletes its links.
 */
export const galleryPhotoTheme = pgTable(
  "gallery_photo_theme",
  {
    photoId: uuid("photo_id")
      .notNull()
      .references(() => galleryPhoto.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => galleryTag.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.photoId, table.tagId] }),
    index("gallery_photo_theme_tag_idx").on(table.tagId),
  ],
);

/** Relations of the gallery tables. */
export const galleryRelations = defineRelationsPart(
  { galleryPhoto, galleryTag, galleryPhotoTheme, user },
  (r) => ({
    galleryPhoto: {
      creator: r.one.user({ from: r.galleryPhoto.createdBy, to: r.user.id }),
      themes: r.many.galleryTag({
        from: r.galleryPhoto.id.through(r.galleryPhotoTheme.photoId),
        to: r.galleryTag.id.through(r.galleryPhotoTheme.tagId),
      }),
    },
    galleryTag: {},
    galleryPhotoTheme: {},
  }),
);
