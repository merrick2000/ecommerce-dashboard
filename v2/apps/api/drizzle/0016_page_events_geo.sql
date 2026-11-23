ALTER TABLE "page_events" ADD COLUMN "city" varchar(120);--> statement-breakpoint
ALTER TABLE "page_events" ADD COLUMN "region" varchar(120);--> statement-breakpoint
ALTER TABLE "page_events" ADD COLUMN "latitude" real;--> statement-breakpoint
ALTER TABLE "page_events" ADD COLUMN "longitude" real;