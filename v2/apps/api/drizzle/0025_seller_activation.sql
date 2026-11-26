CREATE TABLE "seller_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"store_id" varchar(40),
	"type" varchar(40) NOT NULL,
	"data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seller_feedback" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"kind" varchar(20) NOT NULL,
	"answer" varchar(30) NOT NULL,
	"detail" varchar(1000),
	"source" varchar(10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seller_events" ADD CONSTRAINT "seller_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_feedback" ADD CONSTRAINT "seller_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "seller_events_type_idx" ON "seller_events" USING btree ("type","created_at");--> statement-breakpoint
CREATE INDEX "seller_events_user_idx" ON "seller_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "seller_feedback_kind_idx" ON "seller_feedback" USING btree ("kind","created_at");--> statement-breakpoint
CREATE INDEX "seller_feedback_user_idx" ON "seller_feedback" USING btree ("user_id");