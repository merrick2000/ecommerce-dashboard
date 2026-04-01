<?php

namespace App\Console\Commands;

use App\Mail\AbandonedCartMail;
use App\Models\Lead;
use App\Models\Order;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class SendAbandonedCartReminders extends Command
{
    protected $signature = 'leads:remind-abandoned';

    protected $description = 'Send reminder emails for abandoned carts (leads older than 1h without a paid order)';

    public function handle(): int
    {
        $leads = Lead::whereNull('reminded_at')
            ->where('created_at', '<=', now()->subHour())
            ->where('created_at', '>=', now()->subHours(48))
            ->with(['product', 'store.checkoutConfig', 'store.user'])
            ->limit(50)
            ->get();

        $sent = 0;

        foreach ($leads as $lead) {
            $hasPaid = Order::where('store_id', $lead->store_id)
                ->where('product_id', $lead->product_id)
                ->where('customer_email', $lead->customer_email)
                ->where('status', 'paid')
                ->exists();

            if ($hasPaid) {
                $lead->update(['reminded_at' => now()]);
                continue;
            }

            $product = $lead->product;
            $store = $lead->store;

            if (! $product || ! $store) {
                continue;
            }

            $locale = $store->locale ?? 'fr';
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
            $checkoutUrl = $frontendUrl . '/' . $store->slug . '/p/' . $product->id;

            // Promo abandon panier
            $promoConfig = $store->checkoutConfig?->abandoned_cart_promo;
            $promoCode = null;
            $promoMessage = null;

            if ($promoConfig && ($promoConfig['enabled'] ?? false) && ! empty($promoConfig['code'])) {
                $promoCode = $promoConfig['code'];
                $promoMessage = $promoConfig['email_message'] ?? null;
                $checkoutUrl .= '?promo=' . urlencode($promoCode);
            }

            $displayPrice = $product->resolveDisplayPrice($store->currency);
            $coverImage = $product->cover_image
                ? Storage::disk('s3')->url($product->cover_image)
                : null;

            Mail::to($lead->customer_email)->queue(new AbandonedCartMail(
                lead: $lead,
                productName: $product->name,
                formattedPrice: $displayPrice['formatted_effective_price'] ?? $displayPrice['formatted_price'],
                checkoutUrl: $checkoutUrl,
                storeName: $store->name,
                storeLocale: $locale,
                coverImage: $coverImage,
                promoCode: $promoCode,
                promoMessage: $promoMessage,
            ));

            $lead->update(['reminded_at' => now()]);
            $sent++;
        }

        $this->info("Sent {$sent} abandoned cart reminders.");

        return self::SUCCESS;
    }
}
