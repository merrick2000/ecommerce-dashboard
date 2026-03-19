<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Jobs\SendFacebookConversionEvent;
use App\Models\Order;
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
            'payment_method' => 'nullable|string|in:fedapay,paydunya',
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

        $order = Order::create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'customer_email' => $request->customer_email,
            'customer_name' => $request->customer_name,
            'customer_phone' => $request->customer_phone,
            'amount' => $product->effective_price,
            'currency' => $store->currency,
            'status' => 'pending',
            'payment_method' => $request->payment_method,
        ]);

        // -----------------------------------------------------------
        // POINT D'INTÉGRATION PAIEMENT (FedaPay / Paydunya)
        // -----------------------------------------------------------
        // if ($request->payment_method === 'fedapay') {
        //     $transaction = \FedaPay\Transaction::create([...]);
        //     $paymentUrl = $transaction->generateToken()->url;
        // }
        // -----------------------------------------------------------

        // Mode demo : on passe directement la commande en "paid"
        $order->update(['status' => 'paid']);

        // Générer un event_id unique pour la déduplication Pixel/CAPI
        $eventId = Str::uuid()->toString();

        // Dispatch Facebook CAPI si configuré
        $trackingConfig = $store->checkoutConfig?->tracking_config;
        if (
            $trackingConfig &&
            ! empty($trackingConfig['facebook_pixel_id']) &&
            ! empty($trackingConfig['facebook_access_token'])
        ) {
            SendFacebookConversionEvent::dispatch(
                $trackingConfig['facebook_pixel_id'],
                $trackingConfig['facebook_access_token'],
                $trackingConfig['facebook_test_event_code'] ?? null,
                'Purchase',
                $eventId,
                [
                    'value' => $order->amount,
                    'currency' => $order->currency,
                    'content_name' => $product->name,
                    'content_ids' => [(string) $product->id],
                    'content_type' => 'product',
                ],
                $request->customer_email,
                $request->ip(),
                $request->userAgent(),
            );
        }

        return response()->json([
            'order' => [
                'id' => $order->id,
                'amount' => $order->amount,
                'currency' => $order->currency,
                'status' => $order->fresh()->status->value,
                'formatted_amount' => number_format($order->amount, 0, ',', ' ') . ' ' . $order->currency,
            ],
            'event_id' => $eventId,
            'message' => 'Commande créée avec succès.',
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
            $coverUrl = Storage::disk('s3')->temporaryUrl(
                $order->product->cover_image,
                now()->addMinutes(60)
            );
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
