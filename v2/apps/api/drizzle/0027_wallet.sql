CREATE TABLE "wallet_entries" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"store_id" varchar(40) NOT NULL,
	"type" varchar(24) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"order_id" varchar(40),
	"withdrawal_id" bigint,
	"note" varchar(255),
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "withdrawals" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"store_id" varchar(40) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"network" varchar(40) NOT NULL,
	"country" varchar(2) NOT NULL,
	"holder_name" varchar(120),
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"requested_by" bigint,
	"reviewed_by" bigint,
	"reviewed_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"reference" varchar(120),
	"reason" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "checkout_settings" ALTER COLUMN "cod_purchase_on" SET DEFAULT 'delivered';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "wallet_collected" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "wallet_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "wallet_commission_pct" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "wallet_payout_to" jsonb;--> statement-breakpoint
ALTER TABLE "wallet_entries" ADD CONSTRAINT "wallet_entries_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_entries" ADD CONSTRAINT "wallet_entries_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wallet_entries_store_idx" ON "wallet_entries" USING btree ("store_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_entries_order_type_uq" ON "wallet_entries" USING btree ("order_id","type");--> statement-breakpoint
CREATE INDEX "withdrawals_store_idx" ON "withdrawals" USING btree ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "withdrawals_status_idx" ON "withdrawals" USING btree ("status","created_at");