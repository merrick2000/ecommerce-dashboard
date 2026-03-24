<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class CheckoutController extends Controller
{
    /**
     * GET /api/v1/checkout/{store_slug}/{product_id}
     *
     * Retourne un produit spécifique, la config du checkout et les infos de la boutique.
     */
    public function show(string $storeSlug, int $productId): JsonResponse
    {
        $store = Store::where('slug', $storeSlug)
            ->with(['products', 'checkoutConfig'])
            ->first();

        if (! $store) {
            return response()->json([
                'error' => 'Boutique introuvable.',
            ], 404);
        }

        $product = $store->products->where('id', $productId)->where('is_active', true)->first();

        if (! $product) {
            return response()->json([
                'error' => 'Produit introuvable dans cette boutique.',
            ], 404);
        }

        $config = $store->checkoutConfig;

        return response()->json([
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'slug' => $store->slug,
                'currency' => $store->currency,
                'locale' => $store->locale ?? 'fr',
            ],
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $this->signDescriptionImages($product->description),
                'custom_text' => $product->custom_text,
                'price' => $product->price,
                'formatted_price' => number_format($product->price, 0, ',', ' ') . ' ' . $store->currency,
                'effective_price' => $product->effective_price,
                'formatted_effective_price' => number_format($product->effective_price, 0, ',', ' ') . ' ' . $store->currency,
                'has_promo' => $product->hasPromo(),
                'promo_type' => $product->promo_type,
                'promo_value' => $product->promo_value,
                'promo_label' => $product->promo_label,
                'promo_display_style' => $product->promo_display_style ?? 'strikethrough',
                'cover_image' => $product->cover_image
                    ? Storage::disk('s3')->temporaryUrl($product->cover_image, now()->addMinutes(60))
                    : null,
                'features' => $product->features ?? [],
                'features_position' => $product->features_position ?? 'below_description',
                'faqs' => $product->faqs ?? [],
                'testimonials' => $product->testimonials ?? [],
                'testimonials_style' => $product->testimonials_style ?? 'cards',
                'description_ctas' => $product->description_ctas ?? [],
                'video_url' => $product->video_url,
                'video_title' => $product->video_title,
                'video_position' => $product->video_position ?? 'below_description',
                'payment_mode' => $product->payment_mode ?? 'native',
                'payment_link' => $product->payment_link,
                'external_platform' => $product->external_platform,
            ],
            'checkout_config' => $config ? [
                'template_type' => $config->template_type->value,
                'primary_color' => $config->primary_color,
                'cta_text' => $config->cta_text,
                'urgency_config' => $config->urgency_config ?? [],
                'trust_badges' => $config->trust_badges ?? [],
                'sales_popup' => $config->sales_popup ?? [],
                'payment_logos' => $config->payment_logos ?? [],
                'tracking' => $this->buildTrackingConfig($config->tracking_config),
                'page_layout' => $config->page_layout ?? \App\Models\CheckoutConfig::DEFAULT_PAGE_LAYOUT,
            ] : [
                'template_type' => 'CLASSIC',
                'primary_color' => '#E67E22',
                'cta_text' => 'Acheter maintenant',
                'urgency_config' => [],
                'trust_badges' => [],
                'sales_popup' => [],
                'payment_logos' => [],
                'tracking' => null,
                'page_layout' => \App\Models\CheckoutConfig::DEFAULT_PAGE_LAYOUT,
            ],
        ]);
    }

    /**
     * Retourne uniquement les pixel IDs (jamais les tokens/secrets).
     */
    private function buildTrackingConfig(?array $config): ?array
    {
        if (! $config) {
            return null;
        }

        $tracking = [];

        if (! empty($config['facebook_pixel_id'])) {
            $tracking['facebook_pixel_id'] = $config['facebook_pixel_id'];
        }

        if (! empty($config['tiktok_pixel_id'])) {
            $tracking['tiktok_pixel_id'] = $config['tiktok_pixel_id'];
        }

        return ! empty($tracking) ? $tracking : null;
    }

    /**
     * Remplace les URLs S3 directes dans le HTML par des URLs signées temporaires.
     */
    private function signDescriptionImages(?string $html): ?string
    {
        if (! $html) {
            return null;
        }

        $bucket = config('filesystems.disks.s3.bucket');
        $endpoint = config('filesystems.disks.s3.endpoint');
        $url = config('filesystems.disks.s3.url');

        // Construire les patterns possibles pour les URLs S3
        $patterns = array_filter([
            $url ? preg_quote($url, '/') : null,
            $endpoint && $bucket ? preg_quote($endpoint . '/' . $bucket, '/') : null,
        ]);

        if (empty($patterns)) {
            return $html;
        }

        $regex = '/(' . implode('|', $patterns) . ')\/([^"\'>\s]+)/';

        return preg_replace_callback($regex, function ($matches) {
            $path = $matches[2];

            try {
                return Storage::disk('s3')->temporaryUrl($path, now()->addMinutes(60));
            } catch (\Exception $e) {
                return $matches[0]; // Retourner l'URL originale en cas d'erreur
            }
        }, $html);
    }
}
