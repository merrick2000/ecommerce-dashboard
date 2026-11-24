CREATE TABLE "seller_reviews" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"score" smallint,
	"comment" text,
	"consent" boolean DEFAULT false NOT NULL,
	"publish_name" varchar(80),
	"publish_role" varchar(120),
	"store_url" varchar(300),
	"status" varchar(10) DEFAULT 'private' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seller_reviews_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "seller_reviews" ADD CONSTRAINT "seller_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;