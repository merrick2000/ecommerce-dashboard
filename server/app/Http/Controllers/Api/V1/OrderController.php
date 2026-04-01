<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Order;
use App\Models\PageEvent;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    /**
     * POST /api/v1/orders/create
     */
    public function create(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|exists:stores,id',
            'product_id' => 'required|exists:products,id',
            'customer_email' => 'required|email',
            'customer_name' => 'nullable|string|max:255',
            'customer_phone' => 'nullable|string|max:30',
            'utm_source' => 'nullable|string|max:255',
            'utm_medium' => 'nullable|string|max:255',
            'utm_campaign' => 'nullable|string|max:255',
            'referrer' => 'nullable|string|max:2048',
            'promo_code' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Données invalides.',
                'details' => $validator->errors(),
            ], 422);
        }

        $store = Store::findOrFail($request->store_id);
        $product = Product::where('id', $request->product_id)
            ->where('store_id', $store->id)
            ->firstOrFail();

        $resolved = $product->resolveDisplayPrice($store->currency);

        $order = Order::create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'customer_email' => $request->customer_email,
            'customer_name' => $request->customer_name,
            'customer_phone' => $request->customer_phone,
            'amount' => $resolved['effective_price'],
            'currency' => $resolved['currency'],
            'status' => 'pending',
            'payment_method' => $product->payment_mode === 'external_link' ? $product->external_platform : null,
            'source' => $product->payment_mode === 'external_link' ? ($product->external_platform ?? 'external') : 'native',
            'utm_source' => $request->utm_source,
            'utm_medium' => $request->utm_medium,
            'utm_campaign' => $request->utm_campaign,
            'referrer' => $request->referrer,
            'promo_code' => $request->promo_code,
        ]);

        // Tracking interne
        PageEvent::create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'event_type' => 'order_created',
            'session_id' => $request->header('X-Session-Id', Str::random(32)),
            'ip_hash' => hash('sha256', $request->ip()),
            'device_type' => preg_match('/Mobile|Android|iPhone/i', $request->userAgent() ?? '') ? 'mobile' : 'desktop',
            'user_agent' => Str::limit($request->userAgent() ?? '', 512),
        ]);

        // Enregistrer le lead si paiement externe
        if ($product->payment_mode === 'external_link') {
            Lead::create([
                'store_id' => $store->id,
                'product_id' => $product->id,
                'customer_email' => $request->customer_email,
                'customer_name' => $request->customer_name,
                'customer_phone' => $request->customer_phone,
                'source' => $product->external_platform ?? 'external_link',
            ]);
        }

        return response()->json([
            'order' => [
                'id' => $order->id,
                'amount' => $order->amount,
                'currency' => $order->currency,
                'status' => 'pending',
                'formatted_amount' => number_format($order->amount, 0, ',', ' ') . ' ' . $order->currency,
            ],
            'message' => 'Commande créée. Procédez au paiement.',
        ], 201);
    }

    /**
     * GET /api/v1/orders/{id}
     */
    public function show(int $id): JsonResponse
    {
        $order = Order::with(['product', 'store'])->find($id);

        if (! $order) {
            return response()->json(['error' => 'Commande introuvable.'], 404);
        }

        $downloadUrl = null;
        $coverUrl = null;
        $isExternal = $order->product->delivery_type === 'external_url';

        if ($order->status->value === 'paid') {
            $downloadUrl = $order->product->getDownloadUrl();
        }

        if ($order->product->cover_image) {
            $coverUrl = Storage::disk('s3')->url($order->product->cover_image);
        }

        return response()->json([
            'order' => [
                'id' => $order->id,
                'status' => $order->status->value,
                'amount' => $order->amount,
                'currency' => $order->currency,
                'formatted_amount' => number_format($order->amount, 0, ',', ' ') . ' ' . $order->currency,
                'customer_email' => $order->customer_email,
                'customer_name' => $order->customer_name,
                'created_at' => $order->created_at->toIso8601String(),
            ],
            'product' => [
                'id' => $order->product->id,
                'name' => $order->product->name,
                'description' => $order->product->description,
                'cover_image' => $coverUrl,
            ],
            'store' => [
                'name' => $order->store->name,
                'slug' => $order->store->slug,
                'locale' => $order->store->locale ?? 'fr',
            ],
            'download_url' => $downloadUrl,
            'is_external' => $isExternal,
            'tracking' => $this->buildTrackingConfig($order->store->checkoutConfig?->tracking_config),
        ]);
    }

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
}
