CREATE TABLE "gallery_photo_theme" (
	"photo_id" uuid,
	"tag_id" uuid,
	CONSTRAINT "gallery_photo_theme_pkey" PRIMARY KEY("photo_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "gallery_tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"name_en" text,
	"name_pt" text,
	"name_fr" text,
	"name_de" text,
	"name_es" text,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gallery_tag_kind_check" CHECK ("kind" in ('theme', 'series'))
);
--> statement-breakpoint
CREATE TABLE "booking_settings" (
	"id" integer PRIMARY KEY DEFAULT 1,
	"books_open" boolean NOT NULL,
	"reopens_on" date,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "booking_settings_single_row" CHECK ("id" = 1),
	CONSTRAINT "booking_settings_reopens_check" CHECK ("books_open" = false or "reopens_on" is null)
);
--> statement-breakpoint
ALTER TABLE "gallery_photo" ADD COLUMN "series_id" uuid;--> statement-breakpoint
ALTER TABLE "gallery_photo" DROP COLUMN "series";--> statement-breakpoint
CREATE INDEX "gallery_photo_series_idx" ON "gallery_photo" ("series_id");--> statement-breakpoint
CREATE INDEX "gallery_photo_theme_tag_idx" ON "gallery_photo_theme" ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "gallery_tag_kind_name_idx" ON "gallery_tag" ("kind",lower("name"));--> statement-breakpoint
ALTER TABLE "gallery_photo" ADD CONSTRAINT "gallery_photo_series_id_gallery_tag_id_fkey" FOREIGN KEY ("series_id") REFERENCES "gallery_tag"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "gallery_photo_theme" ADD CONSTRAINT "gallery_photo_theme_photo_id_gallery_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "gallery_photo"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "gallery_photo_theme" ADD CONSTRAINT "gallery_photo_theme_tag_id_gallery_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "gallery_tag"("id") ON DELETE CASCADE;