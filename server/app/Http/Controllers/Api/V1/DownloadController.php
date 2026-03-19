<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\DownloadClick;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DownloadController extends Controller
{
    /**
     * GET /api/v1/download/{orderId}
     */
    public function __invoke(int $orderId): JsonResponse
    {
        $order = Order::with('product')->find($orderId);

        if (! $order) {
            return response()->json(['error' => 'Commande introuvable.'], 404);
        }

        if ($order->status !== OrderStatus::PAID) {
            return response()->json(['error' => 'Le paiement n\'a pas été confirmé.'], 403);
        }

        $downloadUrl = $order->product->getDownloadUrl();

        if (! $downloadUrl) {
            return response()->json(['error' => 'Aucun fichier disponible.'], 404);
        }

        return response()->json([
            'download_url' => $downloadUrl,
            'product_name' => $order->product->name,
            'is_external' => $order->product->delivery_type === 'external_url',
            'expires_in' => $order->product->delivery_type === 'file' ? '30 minutes' : null,
        ]);
    }

    /**
     * POST /api/v1/download/{orderId}/track
     */
    public function track(int $orderId, Request $request): JsonResponse
    {
        $order = Order::with('product')->find($orderId);

        if (! $order) {
            return response()->json(['error' => 'Commande introuvable.'], 404);
        }

        DownloadClick::create([
            'order_id' => $order->id,
            'product_id' => $order->product_id,
            'ip_address' => $request->ip(),
            'clicked_at' => now(),
        ]);

        return response()->json(['tracked' => true]);
    }
}
