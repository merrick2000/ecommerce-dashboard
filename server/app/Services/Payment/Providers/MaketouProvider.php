<?php

namespace App\Services\Payment\Providers;

use App\Models\Order;
use App\Services\Payment\PaymentLogger;
use App\Services\Payment\PaymentProviderInterface;
use App\Services\Payment\PaymentResult;
use Illuminate\Support\Facades\Http;

class MaketouProvider implements PaymentProviderInterface
{
    private const BASE_URL = 'https://api.maketou.net';

    public function __construct(
        private string $apiKey,
    ) {}

    public function name(): string
    {
        return 'maketou';
    }

    /**
     * Maketou supporte tous les pays/réseaux — c'est un checkout hébergé.
     */
    public function supports(string $country, string $network): bool
    {
        return true;
    }

    public function initiate(Order $order, string $phone, string $country, string $network): PaymentResult
    {
        $order->load('product');

        $productDocumentId = $order->product->maketou_product_id;

        if (! $productDocumentId) {
            return PaymentResult::failed('maketou', 'Identifiant Maketou non configuré pour ce produit.');
        }

        // Construire la redirectURL vers la page de succès
        $store = $order->store ?? $order->load('store')->store;
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
        $redirectUrl = $frontendUrl . '/' . $store->slug . '/success?order=' . $order->id;

        $payload = [
            'productDocumentId' => $productDocumentId,
            'email' => $order->customer_email,
            'firstName' => $order->customer_name ? explode(' ', $order->customer_name)[0] : 'Client',
            'lastName' => $order->customer_name ? (explode(' ', $order->customer_name, 2)[1] ?? '') : '',
            'phone' => $phone,
            'redirectURL' => $redirectUrl,
            'customerPrice' => $order->amount,
            'meta' => [
                'order_id' => (string) $order->id,
                'store_id' => (string) $order->store_id,
                'product_id' => (string) $order->product_id,
            ],
        ];

        PaymentLogger::info('maketou', 'Creating cart', $payload);

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(30)
                ->post(self::BASE_URL . '/api/v1/stores/cart/checkout', $payload);

            $data = $response->json();

            PaymentLogger::info('maketou', 'Response', ['status' => $response->status(), 'body' => $data]);

            if ($response->status() === 201 && isset($data['cart']['id'], $data['redirectUrl'])) {
                return PaymentResult::redirect(
                    providerName: 'maketou',
                    providerRef: $data['cart']['id'],
                    redirectUrl: $data['redirectUrl'],
                );
            }

            $errorMessage = $data['message'] ?? 'Erreur Maketou inconnue';

            return PaymentResult::failed('maketou', $errorMessage);
        } catch (\Exception $e) {
            PaymentLogger::error('maketou', 'Exception: ' . $e->getMessage());

            return PaymentResult::failed('maketou', 'Erreur de connexion à Maketou: ' . $e->getMessage());
        }
    }

    /**
     * Vérifie le statut d'un panier Maketou.
     */
    public function checkStatus(string $providerRef): string
    {
        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(15)
                ->get(self::BASE_URL . '/api/v1/stores/cart/' . $providerRef);

            $data = $response->json();

            PaymentLogger::info('maketou', 'Status check', ['cart_id' => $providerRef, 'data' => $data]);

            $status = $data['status'] ?? 'unknown';

            return match ($status) {
                'completed' => 'paid',
                'payment_failed', 'abandoned' => 'failed',
                'waiting_payment' => 'pending',
                default => 'pending',
            };
        } catch (\Exception $e) {
            PaymentLogger::error('maketou', 'Status check failed: ' . $e->getMessage());

            return 'pending';
        }
    }

    /**
     * Maketou n'a pas de webhook pour le moment — on utilise le polling via checkStatus.
     */
    public function parseWebhook(array $payload, array $headers): ?array
    {
        return null;
    }
}
