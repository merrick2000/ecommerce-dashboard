<?php

namespace App\Services\Payment\Providers;

use App\Models\Order;
use App\Services\Payment\PaymentLogger;
use App\Services\Payment\PaymentProviderInterface;
use App\Services\Payment\PaymentResult;
use Illuminate\Support\Facades\Http;

class ChariowProvider implements PaymentProviderInterface
{
    private const BASE_URL = 'https://api.chariow.com/v1';

    public function __construct(
        private string $apiKey,
        private string $webhookSecret = '',
    ) {}

    public function name(): string
    {
        return 'chariow';
    }

    public function supports(string $country, string $network): bool
    {
        return true;
    }

    public function initiate(Order $order, string $phone, string $country, string $network): PaymentResult
    {
        $order->load('product');

        $productId = $order->product->chariow_product_id;

        if (! $productId) {
            return PaymentResult::failed('chariow', 'Identifiant Chariow non configuré pour ce produit.');
        }

        $store = $order->store ?? $order->load('store')->store;
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
        $redirectUrl = $frontendUrl . '/' . $store->slug . '/success?order=' . $order->id;

        $nameParts = $order->customer_name ? explode(' ', $order->customer_name, 2) : ['Client', ''];

        $payload = [
            'product_id' => $productId,
            'email' => $order->customer_email,
            'first_name' => $nameParts[0],
            'last_name' => $nameParts[1] ?? '',
            'phone' => [
                'number' => preg_replace('/\D/', '', $phone),
                'country_code' => $country,
            ],
            'redirect_url' => $redirectUrl,
            'payment_currency' => $order->currency,
            'custom_metadata' => [
                'order_id' => (string) $order->id,
                'store_id' => (string) $order->store_id,
                'product_id' => (string) $order->product_id,
            ],
        ];

        $url = self::BASE_URL . '/checkout';
        PaymentLogger::apiRequest('chariow', 'POST', $url, $payload);

        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(30)
                ->post($url, $payload);

            $data = $response->json();

            PaymentLogger::apiResponse('chariow', $response->status(), $data ?? [], $url);

            if (! $response->successful()) {
                $errorMessage = $data['message'] ?? 'Erreur Chariow HTTP ' . $response->status();
                PaymentLogger::error('chariow', $errorMessage, $data['errors'] ?? []);

                return PaymentResult::failed('chariow', $errorMessage);
            }

            $step = $data['data']['step'] ?? null;

            // Produit gratuit ou déjà acheté
            if ($step === 'completed') {
                $saleId = $data['data']['purchase']['id'] ?? 'chariow_free_' . now()->timestamp;

                return PaymentResult::processing('chariow', $saleId, ['raw' => $data]);
            }

            if ($step === 'already_purchased') {
                return PaymentResult::failed('chariow', 'Ce client a déjà acheté ce produit.');
            }

            // Paiement requis — redirection
            if ($step === 'payment') {
                $saleId = $data['data']['purchase']['id'] ?? null;
                $checkoutUrl = $data['data']['payment']['checkout_url'] ?? null;

                if ($saleId && $checkoutUrl) {
                    return PaymentResult::redirect(
                        providerName: 'chariow',
                        providerRef: $saleId,
                        redirectUrl: $checkoutUrl,
                    );
                }
            }

            return PaymentResult::failed('chariow', 'Réponse Chariow inattendue: step=' . ($step ?? 'null'));
        } catch (\Exception $e) {
            PaymentLogger::error('chariow', 'Exception: ' . $e->getMessage());

            return PaymentResult::failed('chariow', 'Erreur de connexion à Chariow: ' . $e->getMessage());
        }
    }

    public function checkStatus(string $providerRef): string
    {
        try {
            $response = Http::withToken($this->apiKey)
                ->timeout(15)
                ->get(self::BASE_URL . '/sales/' . $providerRef);

            $data = $response->json();

            PaymentLogger::info('chariow', 'Status check', ['sale_id' => $providerRef, 'status' => $data['data']['status'] ?? 'unknown']);

            $status = $data['data']['status'] ?? 'unknown';

            return match ($status) {
                'completed', 'settled' => 'paid',
                'failed', 'abandoned' => 'failed',
                'awaiting_payment' => 'pending',
                default => 'pending',
            };
        } catch (\Exception $e) {
            PaymentLogger::error('chariow', 'Status check failed: ' . $e->getMessage());

            return 'pending';
        }
    }

    public function parseWebhook(array $payload, array $headers): ?array
    {
        $event = $payload['event'] ?? null;

        if (! $event) {
            PaymentLogger::error('chariow', 'Webhook missing event field');

            return null;
        }

        // Extraire le sale ID et mapper le statut
        $saleId = $payload['data']['purchase']['id']
            ?? $payload['data']['sale']['id']
            ?? $payload['data']['id']
            ?? null;

        if (! $saleId) {
            PaymentLogger::error('chariow', 'Webhook missing sale ID', $payload);

            return null;
        }

        $status = match ($event) {
            'successful_sale' => 'paid',
            'failed_sale' => 'failed',
            'abandoned_sale' => 'failed',
            default => null,
        };

        if (! $status) {
            PaymentLogger::info('chariow', "Ignoring webhook event: {$event}");

            return null;
        }

        return ['ref' => $saleId, 'status' => $status];
    }

    /**
     * Vérifie la signature HMAC-SHA256 du webhook.
     */
    public function verifyWebhookSignature(string $rawPayload, string $signature): bool
    {
        if (! $this->webhookSecret) {
            return true; // Pas de secret configuré, on accepte
        }

        $expected = hash_hmac('sha256', $rawPayload, $this->webhookSecret);

        return hash_equals($expected, $signature);
    }
}
