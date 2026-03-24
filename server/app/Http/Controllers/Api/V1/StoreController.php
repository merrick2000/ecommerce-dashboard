<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class StoreController extends Controller
{
    /**
     * GET /api/v1/stores
     *
     * Liste toutes les boutiques publiques.
     */
    public function index(): JsonResponse
    {
        $stores = Store::select('id', 'name', 'slug', 'currency')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($stores);
    }

    /**
     * GET /api/v1/stores/{slug}
     *
     * Retourne la boutique et tous ses produits (catalogue).
     */
    public function show(string $slug): JsonResponse
    {
        $store = Store::where('slug', $slug)
            ->with(['products', 'checkoutConfig'])
            ->first();

        if (! $store) {
            return response()->json(['error' => 'Boutique introuvable.'], 404);
        }

        $config = $store->checkoutConfig;

        $products = $store->products->map(function ($product) use ($store) {
            return [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
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
                'thumbnail' => $product->thumbnail
                    ? Storage::disk('s3')->temporaryUrl($product->thumbnail, now()->addMinutes(60))
                    : null,
            ];
        });

        return response()->json([
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'slug' => $store->slug,
                'currency' => $store->currency,
                'locale' => $store->locale ?? 'fr',
            ],
            'products' => $products,
            'checkout_config' => $config ? [
                'primary_color' => $config->primary_color,
                'template_type' => $config->template_type->value,
            ] : [
                'primary_color' => '#E67E22',
                'template_type' => 'CLASSIC',
            ],
        ]);
    }
}
