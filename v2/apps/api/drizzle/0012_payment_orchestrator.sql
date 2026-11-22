CREATE TABLE "po_webhook_events" (
	"event_id" varchar(80) PRIMARY KEY NOT NULL,
	"type" varchar(40),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "po_session_id" varchar(80);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "po_transaction_id" varchar(80);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "po_status" varchar(20);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "po_livemode" boolean;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "po_session_seq" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "po_provider" varchar(30);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "po_operator" varchar(30);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "po_country" varchar(2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "po_failure" varchar(300);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "po_checked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payment_accounts" ADD COLUMN "settings" jsonb;--> statement-breakpoint
CREATE INDEX "orders_po_session_idx" ON "orders" USING btree ("po_session_id");