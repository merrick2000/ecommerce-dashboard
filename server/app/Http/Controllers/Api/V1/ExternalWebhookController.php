<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PaymentSetting;
use App\Models\Product;
use App\Services\Payment\PaymentLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExternalWebhookController extends Controller
{
    /**
     * POST /api/v1/webhooks/external
     *
     * Sync des ventes externes (Selar via Zapier → Sheet → n8n).
     *
     * Payload attendu :
     * {
     *   "platform": "selar",
     *   "status": "paid",
     *   "metadata": { ... données brutes Selar ... }
     * }
     *
     * Header : X-Webhook-Secret
     */
    public function handle(Request $request): JsonResponse
    {
        // Vérifier le secret
        $secret = PaymentSetting::instance()->webhook_secret;

        if (! $secret || $request->header('X-Webhook-Secret') !== $secret) {
            PaymentLogger::error('external', 'Webhook secret invalide', [
                'ip' => $request->ip(),
            ]);

            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $data = $request->validate([
            'platform' => 'required|string|in:selar',
            'status' => 'required|string|in:paid,failed,refunded',
            'metadata' => 'required|array',
        ]);

        $meta = $data['metadata'];
        $platform = $data['platform'];
        $status = $data['status'];

        // Extraire les infos depuis les metadata Selar
        $productCode = $meta['product_code']
            ?? $meta['all_product_codes']
            ?? null;
        $customerEmail = $meta['buyer_email'] ?? null;
        $customerName = $meta['buyer_full_name'] ?? null;
        $customerPhone = $meta['buyer_mobile'] ?? null;
        $amount = $meta['total_amount'] ?? $meta['product_amount'] ?? 0;
        $currency = $meta['currency'] ?? 'XOF';
        $productName = $meta['product_name']
            ?? $meta['all_product_names']
            ?? null;

        if (! $productCode) {
            PaymentLogger::error('external', 'Code produit manquant dans metadata', $meta);

            return response()->json(['error' => 'Missing product code in metadata'], 422);
        }

        if (! $customerEmail) {
            PaymentLogger::error('external', 'Email client manquant dans metadata', $meta);

            return response()->json(['error' => 'Missing buyer email in metadata'], 422);
        }

        PaymentLogger::webhook('external', $productCode, 'received', $data);

        // Trouver le produit Sellit par son code externe
        $product = Product::where('external_product_id', $productCode)->first();

        if (! $product) {
            PaymentLogger::error('external', 'Produit introuvable', [
                'external_product_id' => $productCode,
            ]);

            return response()->json(['error' => 'Product not found', 'product_code' => $productCode], 404);
        }

        // Éviter les doublons par receipt_url (identifiant unique de facture Selar)
        $receiptUrl = $meta['receipt_url'] ?? null;

        if ($receiptUrl && Order::where('payment_ref', $receiptUrl)->exists()) {
            return response()->json([
                'success' => true,
                'message' => 'Order already synced',
            ]);
        }

        // Mapper le status
        $orderStatus = match ($status) {
            'paid' => OrderStatus::PAID,
            'failed' => OrderStatus::FAILED,
            'refunded' => OrderStatus::REFUNDED,
            default => OrderStatus::PENDING,
        };

        // Créer la commande
        $order = Order::create([
            'store_id' => $product->store_id,
            'product_id' => $product->id,
            'customer_email' => $customerEmail,
            'customer_name' => $customerName,
            'customer_phone' => $customerPhone,
            'amount' => $amount,
            'currency' => $currency,
            'status' => $orderStatus,
            'payment_method' => $platform,
            'payment_ref' => $receiptUrl ?? 'ext_' . $platform . '_' . now()->timestamp,
            'source' => $platform,
            'metadata' => $meta,
        ]);

        PaymentLogger::webhook('external', $productCode, $status, [
            'order_id' => $order->id,
            'product' => $product->name,
            'store_id' => $product->store_id,
            'email' => $customerEmail,
            'selar_product' => $productName,
        ]);

        return response()->json([
            'success' => true,
            'order_id' => $order->id,
            'status' => $status,
        ]);
    }
}
