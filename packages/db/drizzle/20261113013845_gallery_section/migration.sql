DROP INDEX "gallery_photo_position_idx";--> statement-breakpoint
ALTER TABLE "gallery_photo" ADD COLUMN "section" text DEFAULT 'work' NOT NULL;--> statement-breakpoint
CREATE INDEX "gallery_photo_section_position_idx" ON "gallery_photo" ("section","position");--> statement-breakpoint
ALTER TABLE "gallery_photo" ADD CONSTRAINT "gallery_photo_section_check" CHECK ("section" in ('work', 'studio'));