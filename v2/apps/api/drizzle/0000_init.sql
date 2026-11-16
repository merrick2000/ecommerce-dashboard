CREATE TABLE "checkout_settings" (
	"store_id" bigint PRIMARY KEY NOT NULL,
	"settings" jsonb NOT NULL,
	"facebook_pixel_id" varchar(30),
	"facebook_test_event_code" varchar(40),
	"tiktok_pixel_id" varchar(40),
	"facebook_access_token_enc" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"store_id" bigint NOT NULL,
	"phone" varchar(30) NOT NULL,
	"name" varchar(120),
	"email" varchar(255),
	"city" varchar(120),
	"address" varchar(500),
	"orders_count" integer DEFAULT 0 NOT NULL,
	"delivered_count" integer DEFAULT 0 NOT NULL,
	"returned_count" integer DEFAULT 0 NOT NULL,
	"total_spent" numeric(12, 2) DEFAULT 0 NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_zones" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"store_id" bigint NOT NULL,
	"name" varchar(80) NOT NULL,
	"country" varchar(2) NOT NULL,
	"cities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"fee" numeric(12, 2) DEFAULT 0 NOT NULL,
	"free_above" numeric(12, 2),
	"cod_allowed" boolean DEFAULT true NOT NULL,
	"eta_label" varchar(60),
	"is_active" boolean DEFAULT true NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "downloads" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"order_id" bigint NOT NULL,
	"product_id" bigint,
	"ip_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"store_id" bigint NOT NULL,
	"product_id" bigint,
	"email" varchar(255),
	"phone" varchar(30),
	"name" varchar(120),
	"source" varchar(20) DEFAULT 'checkout' NOT NULL,
	"reminder_count" smallint DEFAULT 0 NOT NULL,
	"last_reminded_at" timestamp with time zone,
	"next_reminder_at" timestamp with time zone,
	"converted_at" timestamp with time zone,
	"converted_order_id" bigint,
	"reminder_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"order_id" bigint NOT NULL,
	"type" varchar(30) NOT NULL,
	"message" text,
	"data" jsonb,
	"user_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"order_id" bigint NOT NULL,
	"product_id" bigint,
	"variant_id" bigint,
	"product_type" varchar(10) NOT NULL,
	"name" varchar(255) NOT NULL,
	"variant_name" varchar(80),
	"quantity" integer NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"total" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"store_id" bigint NOT NULL,
	"order_number" varchar(20) NOT NULL,
	"access_token" varchar(64) NOT NULL,
	"customer_id" bigint,
	"customer_name" varchar(120),
	"customer_email" varchar(255),
	"customer_phone" varchar(30),
	"city" varchar(120),
	"address" varchar(500),
	"delivery_zone_id" bigint,
	"customer_note" varchar(500),
	"kind" varchar(10) NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"discount" numeric(12, 2) DEFAULT 0 NOT NULL,
	"shipping_fee" numeric(12, 2) DEFAULT 0 NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"currency" varchar(5) NOT NULL,
	"payment_method" varchar(20) NOT NULL,
	"payment_status" varchar(12) DEFAULT 'pending' NOT NULL,
	"payment_provider" varchar(20),
	"payment_ref" varchar(255),
	"paid_at" timestamp with time zone,
	"fulfillment_status" varchar(12) DEFAULT 'new' NOT NULL,
	"confirmed_at" timestamp with time zone,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"returned_at" timestamp with time zone,
	"call_attempts" smallint DEFAULT 0 NOT NULL,
	"courier" varchar(80),
	"tracking_number" varchar(80),
	"promo_code_id" bigint,
	"promo_code" varchar(30),
	"source" varchar(20) DEFAULT 'storefront' NOT NULL,
	"utm_source" varchar(255),
	"utm_medium" varchar(255),
	"utm_campaign" varchar(255),
	"utm_content" varchar(255),
	"referrer" varchar(2048),
	"session_id" varchar(64),
	"event_id" varchar(64) NOT NULL,
	"tracking_context" jsonb,
	"fulfilled_effects_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number"),
	CONSTRAINT "orders_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
CREATE TABLE "page_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"store_id" bigint NOT NULL,
	"product_id" bigint,
	"event_type" varchar(30) NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"ip_hash" varchar(64),
	"referrer" varchar(2048),
	"utm_source" varchar(255),
	"utm_medium" varchar(255),
	"utm_campaign" varchar(255),
	"device_type" varchar(20),
	"country" varchar(2),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_accounts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"store_id" bigint NOT NULL,
	"provider" varchar(20) NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"mode" varchar(10) DEFAULT 'sandbox' NOT NULL,
	"credentials_enc" text,
	"webhook_token" varchar(64) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"order_id" bigint NOT NULL,
	"provider" varchar(20) NOT NULL,
	"provider_ref" varchar(255),
	"country" varchar(2),
	"network" varchar(30),
	"phone" varchar(30),
	"status" varchar(15) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(5) NOT NULL,
	"provider_response" jsonb,
	"webhook_payload" jsonb,
	"error_message" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"product_id" bigint NOT NULL,
	"name" varchar(80) NOT NULL,
	"sku" varchar(60),
	"price" numeric(12, 2),
	"stock" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"store_id" bigint NOT NULL,
	"type" varchar(10) DEFAULT 'digital' NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"compare_at_price" numeric(12, 2),
	"base_currency" varchar(5) DEFAULT 'XOF' NOT NULL,
	"currency_prices" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"promo" jsonb DEFAULT '{"type":"none","value":0,"display":"strikethrough"}'::jsonb NOT NULL,
	"offers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cover_image" varchar(500),
	"thumbnail" varchar(500),
	"content" jsonb NOT NULL,
	"payment" jsonb NOT NULL,
	"delivery" jsonb,
	"external_product_id" varchar(100),
	"sku" varchar(60),
	"track_inventory" boolean DEFAULT false NOT NULL,
	"stock" integer,
	"weight_grams" integer,
	"variant_label" varchar(40),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promo_codes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"store_id" bigint NOT NULL,
	"code" varchar(30) NOT NULL,
	"type" varchar(12) NOT NULL,
	"value" numeric(12, 2) NOT NULL,
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"min_subtotal" numeric(12, 2),
	"product_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip" varchar(64),
	"user_agent" varchar(512),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_members" (
	"store_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"role" varchar(20) DEFAULT 'owner' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "store_members_store_id_user_id_pk" PRIMARY KEY("store_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(80) NOT NULL,
	"subdomain" varchar(80),
	"custom_domain" varchar(255),
	"custom_domain_verified_at" timestamp with time zone,
	"currency" varchar(5) DEFAULT 'XOF' NOT NULL,
	"locale" varchar(5) DEFAULT 'fr' NOT NULL,
	"country" varchar(2) DEFAULT 'BJ' NOT NULL,
	"support_phone" varchar(30),
	"support_email" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stores_slug_unique" UNIQUE("slug"),
	CONSTRAINT "stores_subdomain_unique" UNIQUE("subdomain"),
	CONSTRAINT "stores_custom_domain_unique" UNIQUE("custom_domain")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(30),
	"country" varchar(2),
	"password_hash" varchar(255) NOT NULL,
	"is_platform_admin" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "checkout_settings" ADD CONSTRAINT "checkout_settings_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_zones" ADD CONSTRAINT "delivery_zones_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_converted_order_id_orders_id_fk" FOREIGN KEY ("converted_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_zone_id_delivery_zones_id_fk" FOREIGN KEY ("delivery_zone_id") REFERENCES "public"."delivery_zones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_promo_code_id_promo_codes_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_events" ADD CONSTRAINT "page_events_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_events" ADD CONSTRAINT "page_events_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_accounts" ADD CONSTRAINT "payment_accounts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_members" ADD CONSTRAINT "store_members_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_members" ADD CONSTRAINT "store_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "customers_store_phone_uq" ON "customers" USING btree ("store_id","phone");--> statement-breakpoint
CREATE INDEX "customers_store_email_idx" ON "customers" USING btree ("store_id","email");--> statement-breakpoint
CREATE INDEX "delivery_zones_store_idx" ON "delivery_zones" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "downloads_order_idx" ON "downloads" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "leads_store_created_idx" ON "leads" USING btree ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "leads_due_idx" ON "leads" USING btree ("next_reminder_at") WHERE "leads"."converted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "leads_store_product_email_uq" ON "leads" USING btree ("store_id","product_id","email");--> statement-breakpoint
CREATE INDEX "order_events_order_idx" ON "order_events" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "orders_store_created_idx" ON "orders" USING btree ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_store_fulfillment_idx" ON "orders" USING btree ("store_id","fulfillment_status");--> statement-breakpoint
CREATE INDEX "orders_store_payment_idx" ON "orders" USING btree ("store_id","payment_status");--> statement-breakpoint
CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "orders_payment_ref_idx" ON "orders" USING btree ("payment_ref");--> statement-breakpoint
CREATE INDEX "page_events_store_created_idx" ON "page_events" USING btree ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "page_events_store_type_idx" ON "page_events" USING btree ("store_id","event_type","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_accounts_store_provider_uq" ON "payment_accounts" USING btree ("store_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_accounts_webhook_uq" ON "payment_accounts" USING btree ("webhook_token");--> statement-breakpoint
CREATE INDEX "payment_tx_order_idx" ON "payment_transactions" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_tx_provider_ref_uq" ON "payment_transactions" USING btree ("provider","provider_ref");--> statement-breakpoint
CREATE INDEX "product_variants_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "products_store_idx" ON "products" USING btree ("store_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_store_external_uq" ON "products" USING btree ("store_id","external_product_id") WHERE "products"."external_product_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "promo_codes_store_code_uq" ON "promo_codes" USING btree ("store_id","code");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "store_members_user_idx" ON "store_members" USING btree ("user_id");