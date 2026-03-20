<?php

namespace App\Services\Payment\Providers;

use App\Models\Order;
use App\Services\Payment\PaymentLogger;
use App\Services\Payment\PaymentProviderInterface;
use App\Services\Payment\PaymentResult;
use Illuminate\Support\Facades\Http;

class FedaPayProvider implements PaymentProviderInterface
{
    private const SUPPORTED = [
        'BJ' => ['mtn', 'moov'],
        'TG' => ['mtn', 'moov'],
        'SN' => ['wave', 'orange', 'free'],
        'CI' => ['mtn', 'moov', 'orange', 'wave'],
    ];

    public function __construct(
        private string $apiKey,
        private string $baseUrl = 'https://sandbox-api.fedapay.com/v1',
        private ?string $webhookSecret = null,
    ) {
        $this->baseUrl = rtrim($this->baseUrl, '/');
    }

    public function name(): string
    {
        return 'fedapay';
    }

    public function supports(string $country, string $network): bool
    {
        return isset(self::SUPPORTED[$country]) && in_array($network, self::SUPPORTED[$country]);
    }

    public function initiate(Order $order, string $phone, string $country, string $network): PaymentResult
    {
        try {
            // Étape 1 : Créer la transaction
            $txUrl = "{$this->baseUrl}/transactions";
            $txBody = [
                'description' => "Commande #{$order->id}",
                'amount' => $order->amount,
                'currency' => ['iso' => $order->currency],
                'callback_url' => config('app.url') . '/api/v1/webhooks/fedapay',
                'customer' => [
                    'email' => $order->customer_email,
                    'phone_number' => [
                        'number' => $this->cleanPhone($phone),
                        'country' => $country,
                    ],
                ],
            ];

            PaymentLogger::apiRequest('fedapay', 'POST', $txUrl, $txBody);

            $txResponse = Http::timeout(10)->withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($txUrl, $txBody);

            $txData = $txResponse->json() ?? [];

            PaymentLogger::apiResponse('fedapay', $txResponse->status(), $txData, $txUrl);

            if (! $txResponse->successful()) {
                $result = PaymentResult::failed('fedapay', 'Create TX: HTTP ' . $txResponse->status());
                PaymentLogger::result($result);

                return $result;
            }

            $txId = $txData['v1']['transaction']['id'] ?? $txData['transaction']['id'] ?? null;

            if (! $txId) {
                $result = PaymentResult::failed('fedapay', 'No transaction ID returned');
                PaymentLogger::result($result);

                return $result;
            }

            // Étape 2 : Générer le token de paiement
            $tokenUrl = "{$this->baseUrl}/transactions/{$txId}/token";

            PaymentLogger::apiRequest('fedapay', 'POST', $tokenUrl, []);

            $tokenResponse = Http::timeout(10)->withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($tokenUrl, []);

            $tokenData = $tokenResponse->json() ?? [];

            PaymentLogger::apiResponse('fedapay', $tokenResponse->status(), $tokenData, $tokenUrl);

            if (! $tokenResponse->successful()) {
                $result = PaymentResult::failed('fedapay', 'Token: HTTP ' . $tokenResponse->status());
                PaymentLogger::result($result);

                return $result;
            }

            $paymentUrl = $tokenData['token'] ?? $tokenData['url'] ?? null;

            if ($paymentUrl) {
                $result = PaymentResult::redirect('fedapay', (string) $txId, $paymentUrl);
                PaymentLogger::result($result);

                return $result;
            }

            $result = PaymentResult::processing('fedapay', (string) $txId, ['raw' => $txData]);
            PaymentLogger::result($result);

            return $result;
        } catch (\Exception $e) {
            PaymentLogger::error('fedapay', $e->getMessage(), ['order_id' => $order->id]);

            return PaymentResult::failed('fedapay', $e->getMessage());
        }
    }

    public function checkStatus(string $providerRef): string
    {
        try {
            $url = "{$this->baseUrl}/transactions/{$providerRef}";

            $response = Http::timeout(5)->withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
            ])->get($url);

            $data = $response->json() ?? [];
            $status = $data['v1']['transaction']['status'] ?? $data['transaction']['status'] ?? '';

            $mapped = match ($status) {
                'approved', 'transferred' => 'paid',
                'declined', 'canceled', 'refunded' => 'failed',
                default => 'pending',
            };

            PaymentLogger::statusCheck('fedapay', $providerRef, "HTTP {$response->status()} raw={$status} → {$mapped}");

            return $mapped;
        } catch (\Exception $e) {
            PaymentLogger::error('fedapay', "checkStatus: {$e->getMessage()}", ['ref' => $providerRef]);

            return 'pending';
        }
    }

    public function parseWebhook(array $payload, array $headers): ?array
    {
        if ($this->webhookSecret) {
            $signature = $headers['x-fedapay-signature'][0] ?? $headers['X-FEDAPAY-SIGNATURE'][0] ?? null;
            if ($signature && ! $this->verifySignature($payload, $signature)) {
                PaymentLogger::error('fedapay', 'Webhook signature mismatch');

                return null;
            }
        }

        $entity = $payload['entity'] ?? [];
        $ref = $entity['id'] ?? $payload['id'] ?? null;
        $status = $entity['status'] ?? $payload['status'] ?? '';

        if (! $ref) {
            return null;
        }

        return [
            'ref' => (string) $ref,
            'status' => match ($status) {
                'approved', 'transferred' => 'paid',
                'declined', 'canceled', 'refunded' => 'failed',
                default => 'pending',
            },
        ];
    }

    private function verifySignature(array $payload, string $signature): bool
    {
        $computed = hash_hmac('sha256', json_encode($payload), $this->webhookSecret);

        return hash_equals($computed, $signature);
    }

    private function cleanPhone(string $phone): string
    {
        return preg_replace('/[^0-9+]/', '', $phone);
    }
}
