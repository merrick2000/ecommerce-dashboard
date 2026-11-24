CREATE TABLE "contact_messages" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(40),
	"message" text NOT NULL,
	"page" varchar(200),
	"lang" varchar(2),
	"ip" varchar(64),
	"status" varchar(10) DEFAULT 'new' NOT NULL,
	"handled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_emails" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"kind" varchar(20) NOT NULL,
	"step" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_opt_out_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "onboarding_emails" ADD CONSTRAINT "onboarding_emails_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_messages_status_idx" ON "contact_messages" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "onboarding_emails_uq" ON "onboarding_emails" USING btree ("user_id","kind","step");