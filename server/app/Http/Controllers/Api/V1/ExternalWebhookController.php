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
     * Reçoit les notifications de paiement depuis n8n (Selar via Zapier → Sheet → n8n).
     *
     * Payload attendu :
     * {
     *   "platform": "selar",
     *   "external_product_id": "abc123",
     *   "customer_email": "client@mail.com",
     *   "customer_name": "Fatou Diallo",
     *   "amount": 5000,
     *   "currency": "XOF"
     * }
     *
     * Header : X-Webhook-Secret
     */
    public function handle(Request $request): JsonResponse
    {
        // Vérifier le secret (stocké en DB, géré depuis le dashboard)
        $secret = PaymentSetting::instance()->webhook_secret;

        if (! $secret || $request->header('X-Webhook-Secret') !== $secret) {
            PaymentLogger::error('external', 'Webhook secret invalide', [
                'ip' => $request->ip(),
            ]);

            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $data = $request->validate([
            'platform' => 'required|string|in:selar',
            'external_product_id' => 'required|string',
            'customer_email' => 'required|email',
            'customer_name' => 'nullable|string|max:255',
            'amount' => 'nullable|numeric',
            'currency' => 'nullable|string|max:10',
        ]);

        PaymentLogger::webhook('external', $data['external_product_id'], 'received', $data);

        // Trouver le produit Sellit par son code externe
        $product = Product::where('external_product_id', $data['external_product_id'])->first();

        if (! $product) {
            PaymentLogger::error('external', 'Produit introuvable', [
                'external_product_id' => $data['external_product_id'],
            ]);

            return response()->json(['error' => 'Product not found'], 404);
        }

        // Chercher la commande pending la plus récente pour ce produit + email
        $order = Order::where('product_id', $product->id)
            ->where('customer_email', $data['customer_email'])
            ->where('status', OrderStatus::PENDING)
            ->orderBy('created_at', 'desc')
            ->first();

        if (! $order) {
            PaymentLogger::error('external', 'Aucune commande pending trouvée', [
                'product_id' => $product->id,
                'email' => $data['customer_email'],
            ]);

            return response()->json(['error' => 'No pending order found'], 404);
        }

        // Passer la commande en paid
        $order->update([
            'status' => OrderStatus::PAID,
            'payment_method' => $data['platform'],
            'payment_ref' => 'ext_' . $data['platform'] . '_' . now()->timestamp,
        ]);

        PaymentLogger::webhook('external', $data['external_product_id'], 'paid', [
            'order_id' => $order->id,
            'product' => $product->name,
            'store_id' => $order->store_id,
            'email' => $data['customer_email'],
        ]);

        return response()->json([
            'success' => true,
            'order_id' => $order->id,
            'status' => 'paid',
        ]);
    }
}
