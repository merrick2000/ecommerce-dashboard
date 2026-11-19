CREATE TABLE "billing_payments" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"plan" varchar(20) NOT NULL,
	"months" smallint NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(5) NOT NULL,
	"provider" varchar(20) NOT NULL,
	"provider_ref" varchar(255),
	"status" varchar(10) DEFAULT 'pending' NOT NULL,
	"phone" varchar(30),
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"key" varchar(60) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"user_id" bigint PRIMARY KEY NOT NULL,
	"plan" varchar(20) NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"source" varchar(10) DEFAULT 'paid' NOT NULL,
	"note" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "status" varchar(10) DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "paused_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "pause_message" varchar(300);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "closed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "signup_source" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "disabled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "features" jsonb;--> statement-breakpoint
ALTER TABLE "billing_payments" ADD CONSTRAINT "billing_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "billing_payments_user_idx" ON "billing_payments" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "billing_payments_ref_idx" ON "billing_payments" USING btree ("provider_ref");--> statement-breakpoint
CREATE INDEX "orders_store_archived_idx" ON "orders" USING btree ("store_id","archived_at");