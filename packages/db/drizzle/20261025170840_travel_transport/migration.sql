ALTER TABLE "travel_settings" ADD COLUMN "car_day_min_euros" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "travel_settings" ADD COLUMN "car_day_max_euros" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "travel_settings" ADD COLUMN "ride_min_euros" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "travel_settings" ADD COLUMN "ride_max_euros" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "travel_settings" ADD COLUMN "drive_minutes" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "travel_settings" ADD CONSTRAINT "travel_settings_transport_check" CHECK ("car_day_min_euros" >= 0 and "car_day_min_euros" <= "car_day_max_euros" and "ride_min_euros" >= 0 and "ride_min_euros" <= "ride_max_euros" and "drive_minutes" > 0);