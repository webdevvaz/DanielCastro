CREATE TABLE "travel_settings" (
	"id" integer PRIMARY KEY DEFAULT 1,
	"coach_fare_euros" integer NOT NULL,
	"coach_minutes" integer NOT NULL,
	"hotel_from_euros" integer NOT NULL,
	"hotel_typical_min_euros" integer NOT NULL,
	"hotel_typical_max_euros" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "travel_settings_single_row" CHECK ("id" = 1),
	CONSTRAINT "travel_settings_values_check" CHECK ("coach_fare_euros" >= 0 and "coach_minutes" > 0 and "hotel_from_euros" >= 0 and "hotel_from_euros" <= "hotel_typical_min_euros" and "hotel_typical_min_euros" <= "hotel_typical_max_euros")
);
