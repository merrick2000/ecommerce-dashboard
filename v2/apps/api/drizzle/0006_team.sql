CREATE TABLE "activity_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"store_id" varchar(40) NOT NULL,
	"user_id" bigint,
	"entity_type" varchar(30) NOT NULL,
	"entity_id" varchar(40),
	"entity_label" varchar(255),
	"action" varchar(40) NOT NULL,
	"message" text NOT NULL,
	"product_ids" jsonb,
	"data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_invitations" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"store_id" varchar(40) NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(20) NOT NULL,
	"product_ids" jsonb,
	"options" jsonb DEFAULT '{"viewRevenue":false,"exportData":false}'::jsonb NOT NULL,
	"invited_by" bigint,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_by" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "store_invitations_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "store_member_products" (
	"store_id" varchar(40) NOT NULL,
	"user_id" bigint NOT NULL,
	"product_id" varchar(40) NOT NULL,
	CONSTRAINT "store_member_products_store_id_user_id_product_id_pk" PRIMARY KEY("store_id","user_id","product_id")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "assigned_to" bigint;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "assigned_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "store_members" ADD COLUMN "options" jsonb DEFAULT '{"viewRevenue":false,"exportData":false}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "store_members" ADD COLUMN "all_products" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_invitations" ADD CONSTRAINT "store_invitations_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_invitations" ADD CONSTRAINT "store_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_invitations" ADD CONSTRAINT "store_invitations_accepted_by_users_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_member_products" ADD CONSTRAINT "store_member_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_member_products" ADD CONSTRAINT "store_member_products_store_id_user_id_store_members_store_id_user_id_fk" FOREIGN KEY ("store_id","user_id") REFERENCES "public"."store_members"("store_id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_log_store_created_idx" ON "activity_log" USING btree ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "store_invitations_store_idx" ON "store_invitations" USING btree ("store_id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_store_assigned_idx" ON "orders" USING btree ("store_id","assigned_to");--> statement-breakpoint
UPDATE "store_members" SET "role" = 'closer' WHERE "role" = 'confirmer';--> statement-breakpoint
UPDATE "store_members" SET "role" = 'order_manager' WHERE "role" = 'staff';
