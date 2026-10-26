ALTER TABLE "guest_spot" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "guest_spot" ALTER COLUMN "status" SET DATA TYPE text USING "status"::text;--> statement-breakpoint
ALTER TABLE "guest_spot" ALTER COLUMN "status" SET DEFAULT 'open';--> statement-breakpoint
ALTER TABLE "guest_spot" ADD CONSTRAINT "guest_spot_status_check" CHECK ("status" in ('open', 'full'));--> statement-breakpoint
DROP TYPE "guest_spot_status";