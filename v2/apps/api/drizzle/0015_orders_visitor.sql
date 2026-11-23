ALTER TABLE "orders" ADD COLUMN "visitor_id" varchar(64);--> statement-breakpoint
CREATE INDEX "page_events_store_visitor_idx" ON "page_events" USING btree ("store_id","visitor_id");--> statement-breakpoint
CREATE INDEX "page_events_store_session_idx" ON "page_events" USING btree ("store_id","session_id");