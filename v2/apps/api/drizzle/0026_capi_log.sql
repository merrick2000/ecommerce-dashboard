ALTER TABLE "checkout_settings" ADD COLUMN "capi_log" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "checkout_settings" ALTER COLUMN "cod_purchase_on" SET DEFAULT 'delivered';--> statement-breakpoint
-- Paiement à la livraison : la commande passée est un prospect (Lead), l'achat est déclaré à la livraison (argent encaissé).
UPDATE "checkout_settings" SET "cod_purchase_on" = 'delivered' WHERE "cod_purchase_on" = 'created';
