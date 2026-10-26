CREATE TABLE "instagram_connection" (
	"id" integer PRIMARY KEY DEFAULT 1,
	"instagram_user_id" text NOT NULL,
	"username" text NOT NULL,
	"access_token" text NOT NULL,
	"token_expires_at" timestamp NOT NULL,
	"token_refreshed_at" timestamp DEFAULT now() NOT NULL,
	"connected_by" text,
	"connected_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "instagram_connection_single_row" CHECK ("id" = 1)
);
--> statement-breakpoint
ALTER TABLE "gallery_photo" ADD COLUMN "instagram_media_id" text;--> statement-breakpoint
ALTER TABLE "gallery_photo" ADD CONSTRAINT "gallery_photo_instagram_media_id_key" UNIQUE("instagram_media_id");--> statement-breakpoint
ALTER TABLE "instagram_connection" ADD CONSTRAINT "instagram_connection_connected_by_user_id_fkey" FOREIGN KEY ("connected_by") REFERENCES "user"("id") ON DELETE SET NULL;