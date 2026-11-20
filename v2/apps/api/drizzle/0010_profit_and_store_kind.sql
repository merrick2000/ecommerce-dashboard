CREATE TABLE "store_expenses" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"store_id" varchar(40) NOT NULL,
	"spent_on" date NOT NULL,
	"category" varchar(20) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"label" varchar(160),
	"product_id" varchar(40),
	"created_by" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "delivery_zones" ADD COLUMN "courier_cost" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "delivery_zones" ADD COLUMN "return_cost" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "unit_cost" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_cost" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "return_cost" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "cost_price" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cost_price" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "kind" varchar(10) DEFAULT 'physical' NOT NULL;--> statement-breakpoint
ALTER TABLE "store_expenses" ADD CONSTRAINT "store_expenses_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_expenses" ADD CONSTRAINT "store_expenses_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_expenses" ADD CONSTRAINT "store_expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "store_expenses_store_day_idx" ON "store_expenses" USING btree ("store_id","spent_on");--> statement-breakpoint
-- Boutiques existantes : « digital » si elles n'ont que des produits digitaux, sinon « physical » (défaut).
UPDATE "stores" SET "kind" = 'digital' WHERE EXISTS (SELECT 1 FROM "products" p WHERE p."store_id" = "stores"."id") AND NOT EXISTS (SELECT 1 FROM "products" p WHERE p."store_id" = "stores"."id" AND p."type" = 'physical');
