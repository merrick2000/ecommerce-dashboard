<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
            ->with(['products' => fn ($q) => $q->where('is_active', true), 'checkoutConfig'])
            ->first();

        if (! $store) {
            return response()->json(['error' => 'Boutique introuvable.'], 404);
        }

        $config = $store->checkoutConfig;

        $products = $store->products->map(function ($product) use ($store) {
            $displayPrice = $product->resolveDisplayPrice($store->currency);

            return [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                ...$displayPrice,
                'has_promo' => $product->hasPromo(),
                'promo_type' => $product->promo_type,
                'promo_value' => $product->promo_value,
                'promo_label' => $product->promo_label,
                'promo_display_style' => $product->promo_display_style ?? 'strikethrough',
                'cover_image' => $product->cover_image
                    ? Storage::disk('s3')->url($product->cover_image)
                    : null,
                'thumbnail' => $product->thumbnail
                    ? Storage::disk('s3')->url($product->thumbnail)
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

    /**
     * GET /api/v1/stores/resolve/domain?host=xxx
     *
     * Résout un domaine/sous-domaine en slug de boutique.
     */
    public function resolveByDomain(Request $request): JsonResponse
    {
        $host = $request->query('host');

        if (! $host) {
            return response()->json(['error' => 'Host required'], 422);
        }

        // 1. Custom domain exact match (shop.monbrand.com)
        $store = Store::where('custom_domain', $host)->first();

        // 2. Subdomain match (maboutique.sellit.com → maboutique)
        if (! $store) {
            $baseDomain = config('app.base_domain', 'sellit.com');
            if (str_ends_with($host, '.' . $baseDomain)) {
                $subdomain = str_replace('.' . $baseDomain, '', $host);
                $store = Store::where('subdomain', $subdomain)->first();
            }
        }

        if (! $store) {
            return response()->json(['error' => 'Store not found'], 404);
        }

        return response()->json([
            'slug' => $store->slug,
        ]);
    }
}
