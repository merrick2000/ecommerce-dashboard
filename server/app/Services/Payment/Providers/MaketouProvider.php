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

    public function supports(string $country, string $network): bool
    {
        return true;
    }

    public function initiate(Order $order, string $phone, string $country, string $network): PaymentResult
    {
        $order->load('product');

        $productDocumentId = $order->product->maketou_product_id;

        if (! $productDocumentId) {
            PaymentLogger::error('maketou', 'Product missing maketou_product_id', [
                'product_id' => $order->product_id,
                'product_name' => $order->product->name,
            ]);

            return PaymentResult::failed('maketou', 'Identifiant Maketou non configuré pour ce produit.');
        }

        $store = $order->store ?? $order->load('store')->store;
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
        $redirectUrl = $frontendUrl . '/' . $store->slug . '/success?order=' . $order->id;

        $payload = [
            'productDocumentId' => $productDocumentId,
            'email' => $order->customer_email,
            'firstName' => $order->customer_name ? explode(' ', $order->customer_name)[0] : 'Client',
            'lastName' => $order->customer_name ? (explode(' ', $order->customer_name, 2)[1] ?? '.') : '.',
            'phone' => $order->customer_phone ?: $phone,
            'redirectURL' => $redirectUrl,
            'customerPrice' => $order->amount,
            'meta' => [
                'order_id' => (string) $order->id,
                'store_id' => (string) $order->store_id,
                'product_id' => (string) $order->product_id,
            ],
        ];

        $url = self::BASE_URL . '/api/v1/stores/cart/checkout';

        PaymentLogger::apiRequest('maketou', 'POST', $url, $payload);

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(30)
                ->post($url, $payload);

            $data = $response->json();

            PaymentLogger::apiResponse('maketou', $response->status(), $data ?? [], $url);

            if ($response->status() === 201 && isset($data['cart']['id'], $data['redirectUrl'])) {
                $result = PaymentResult::redirect(
                    providerName: 'maketou',
                    providerRef: $data['cart']['id'],
                    redirectUrl: $data['redirectUrl'],
                );
                PaymentLogger::result($result);

                return $result;
            }

            $errorMessage = $data['message'] ?? $data['code'] ?? 'HTTP ' . $response->status();
            $result = PaymentResult::failed('maketou', $errorMessage);
            PaymentLogger::result($result);

            return $result;
        } catch (\Exception $e) {
            PaymentLogger::error('maketou', 'Exception: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return PaymentResult::failed('maketou', 'Erreur de connexion à Maketou: ' . $e->getMessage());
        }
    }

    public function checkStatus(string $providerRef): string
    {
        $url = self::BASE_URL . '/api/v1/stores/cart/' . $providerRef;

        PaymentLogger::apiRequest('maketou', 'GET', $url);

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(15)
                ->get($url);

            $data = $response->json();

            PaymentLogger::apiResponse('maketou', $response->status(), $data ?? [], $url);

            $status = $data['status'] ?? 'unknown';
            $mapped = match ($status) {
                'completed' => 'paid',
                'payment_failed', 'abandoned' => 'failed',
                'waiting_payment' => 'pending',
                default => 'pending',
            };

            PaymentLogger::statusCheck('maketou', $providerRef, $mapped);

            return $mapped;
        } catch (\Exception $e) {
            PaymentLogger::error('maketou', 'Status check failed: ' . $e->getMessage());

            return 'pending';
        }
    }

    public function parseWebhook(array $payload, array $headers): ?array
    {
        return null;
    }
}
