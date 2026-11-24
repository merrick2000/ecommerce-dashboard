ALTER TABLE "contact_messages" ADD COLUMN "source" varchar(10) DEFAULT 'form' NOT NULL;--> statement-breakpoint
ALTER TABLE "contact_messages" ADD COLUMN "external_id" varchar(80);--> statement-breakpoint
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_external_id_unique" UNIQUE("external_id");