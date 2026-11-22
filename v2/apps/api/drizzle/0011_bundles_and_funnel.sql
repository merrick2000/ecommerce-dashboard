ALTER TABLE "order_items" ADD COLUMN "role" varchar(10) DEFAULT 'main' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "bundle" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "bundle" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "funnel" jsonb;