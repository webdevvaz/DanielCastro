CREATE TABLE "email_settings" (
	"id" integer PRIMARY KEY DEFAULT 1,
	"sender" text,
	"recipients" text,
	"resend_key_ciphertext" text,
	"resend_key_hint" text,
	"updated_by" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_settings_single_row" CHECK ("id" = 1),
	CONSTRAINT "email_settings_key_check" CHECK (("resend_key_ciphertext" is null) = ("resend_key_hint" is null))
);
--> statement-breakpoint
CREATE TABLE "enquiry" (
	"id" uuid PRIMARY KEY,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"age" integer NOT NULL,
	"instagram" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"city" text NOT NULL,
	"country" text NOT NULL,
	"location_kind" text NOT NULL,
	"guest_spot_id" uuid,
	"location_detail" text,
	"theme" text NOT NULL,
	"description" text NOT NULL,
	"questions" text,
	"status" text DEFAULT 'new' NOT NULL,
	"email_status" text NOT NULL,
	"email_sent_at" timestamp,
	"consented_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "enquiry_locale_check" CHECK ("locale" in ('en', 'pt', 'fr', 'de', 'es')),
	CONSTRAINT "enquiry_status_check" CHECK ("status" in ('new', 'quoted', 'booked', 'declined')),
	CONSTRAINT "enquiry_email_status_check" CHECK ("email_status" in ('sent', 'failed', 'not_configured')),
	CONSTRAINT "enquiry_location_check" CHECK ("location_kind" in ('braga', 'guest_spot', 'other') and ("location_kind" = 'braga') = ("location_detail" is null) and ("location_kind" = 'guest_spot' or "guest_spot_id" is null)),
	CONSTRAINT "enquiry_age_check" CHECK ("age" >= 18)
);
--> statement-breakpoint
CREATE TABLE "enquiry_photo" (
	"id" uuid PRIMARY KEY,
	"enquiry_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"position" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	CONSTRAINT "enquiry_photo_kind_check" CHECK ("kind" in ('reference', 'favourite', 'placement'))
);
--> statement-breakpoint
CREATE INDEX "enquiry_created_at_idx" ON "enquiry" ("created_at");--> statement-breakpoint
CREATE INDEX "enquiry_photo_enquiry_id_idx" ON "enquiry_photo" ("enquiry_id");--> statement-breakpoint
ALTER TABLE "email_settings" ADD CONSTRAINT "email_settings_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "enquiry" ADD CONSTRAINT "enquiry_guest_spot_id_guest_spot_id_fkey" FOREIGN KEY ("guest_spot_id") REFERENCES "guest_spot"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "enquiry_photo" ADD CONSTRAINT "enquiry_photo_enquiry_id_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "enquiry"("id") ON DELETE CASCADE;