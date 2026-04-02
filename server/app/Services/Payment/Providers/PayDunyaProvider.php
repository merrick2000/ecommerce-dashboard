<?php

namespace App\Services\Payment\Providers;

use App\Models\Order;
use App\Services\Payment\PaymentLogger;
use App\Services\Payment\PaymentProviderInterface;
use App\Services\Payment\PaymentResult;
use Illuminate\Support\Facades\Http;

class PayDunyaProvider implements PaymentProviderInterface
{
    private const SUPPORTED = [
        'SN' => ['wave', 'orange', 'free'],
        'BJ' => ['mtn', 'moov'],
        'BF' => ['orange', 'moov'],
        'CI' => ['mtn', 'moov', 'orange', 'wave'],
        'TG' => ['tmoney', 'moov'],
        'CM' => ['mtn'],
    ];

    public function __construct(
        private string $masterKey,
        private string $publicKey,
        private string $privateKey,
        private string $token,
        private string $baseUrl = 'https://app.paydunya.com/sandbox-api/v1',
    ) {
        $this->baseUrl = rtrim($this->baseUrl, '/');
    }

    public function name(): string
    {
        return 'paydunya';
    }

    public function supports(string $country, string $network): bool
    {
        return isset(self::SUPPORTED[$country]) && in_array($network, self::SUPPORTED[$country]);
    }

    public function initiate(Order $order, string $phone, string $country, string $network): PaymentResult
    {
        try {
            // ─── Étape 1 : Créer la facture ─────────────────────
            $invoiceUrl = "{$this->baseUrl}/checkout-invoice/create";
            $invoiceBody = [
                'invoice' => [
                    'items' => [
                        'item_0' => [
                            'name' => "Commande #{$order->id}",
                            'quantity' => 1,
                            'unit_price' => (int) ceil($order->amount),
                            'total_price' => (int) ceil($order->amount),
                        ],
                    ],
                    'total_amount' => (int) ceil($order->amount),
                    'description' => "Paiement Sellit - Commande #{$order->id}",
                ],
                'store' => ['name' => 'Sellit'],
                'custom_data' => [
                    'order_id' => (string) $order->id,
                    'country' => $country,
                    'network' => $network,
                ],
                'actions' => [
                    'callback_url' => config('app.url') . '/api/v1/webhooks/paydunya',
                ],
            ];

            PaymentLogger::apiRequest('paydunya', 'POST', $invoiceUrl, $invoiceBody);

            $invoiceResponse = Http::timeout(10)->withHeaders($this->headers())->post($invoiceUrl, $invoiceBody);
            $invoiceData = $invoiceResponse->json() ?? [];

            PaymentLogger::apiResponse('paydunya', $invoiceResponse->status(), $invoiceData, $invoiceUrl);

            if (! $invoiceResponse->successful()) {
                $result = PaymentResult::failed('paydunya', 'Invoice: HTTP ' . $invoiceResponse->status());
                PaymentLogger::result($result);

                return $result;
            }

            if (($invoiceData['response_code'] ?? '') !== '00') {
                $result = PaymentResult::failed('paydunya', $invoiceData['response_text'] ?? 'Invoice creation failed');
                PaymentLogger::result($result);

                return $result;
            }

            $invoiceToken = $invoiceData['token'] ?? null;
            $redirectUrl = $invoiceData['response_text'] ?? null;

            if (! $invoiceToken) {
                $result = PaymentResult::failed('paydunya', 'No invoice token returned');
                PaymentLogger::result($result);

                return $result;
            }

            // ─── Étape 2 : Créer OPR ──────────────────────────
            $oprUrl = "{$this->baseUrl}/opr/create";
            $oprBody = [
                'invoice_token' => $invoiceToken,
                'account_alias' => $this->cleanPhone($phone),
            ];

            PaymentLogger::apiRequest('paydunya', 'POST', $oprUrl, $oprBody);

            $oprResponse = Http::timeout(10)->withHeaders($this->headers())->post($oprUrl, $oprBody);
            $oprData = $oprResponse->json() ?? [];

            PaymentLogger::apiResponse('paydunya', $oprResponse->status(), $oprData, $oprUrl);

            if (! $oprResponse->successful()) {
                if ($redirectUrl && filter_var($redirectUrl, FILTER_VALIDATE_URL)) {
                    $result = PaymentResult::redirect('paydunya', $invoiceToken, $redirectUrl);
                    PaymentLogger::result($result);

                    return $result;
                }

                $result = PaymentResult::failed('paydunya', 'OPR create: HTTP ' . $oprResponse->status());
                PaymentLogger::result($result);

                return $result;
            }

            if (($oprData['response_code'] ?? '') === '00') {
                $oprToken = $oprData['token'] ?? null;

                if (! $oprToken) {
                    $result = PaymentResult::failed('paydunya', 'No OPR token returned');
                    PaymentLogger::result($result);

                    return $result;
                }

                $result = PaymentResult::otpRequired('paydunya', $invoiceToken, [
                    'opr_token' => $oprToken,
                    'invoice_token' => $invoiceToken,
                    'raw' => $oprData,
                ]);
                PaymentLogger::result($result);

                return $result;
            }

            if ($redirectUrl && filter_var($redirectUrl, FILTER_VALIDATE_URL)) {
                $result = PaymentResult::redirect('paydunya', $invoiceToken, $redirectUrl);
                PaymentLogger::result($result);

                return $result;
            }

            $result = PaymentResult::failed('paydunya', $oprData['response_text'] ?? 'OPR create failed');
            PaymentLogger::result($result);

            return $result;
        } catch (\Exception $e) {
            PaymentLogger::error('paydunya', $e->getMessage(), ['order_id' => $order->id]);

            return PaymentResult::failed('paydunya', $e->getMessage());
        }
    }

    public function confirmOtp(string $oprToken, string $otpCode): PaymentResult
    {
        try {
            $url = "{$this->baseUrl}/opr/charge";
            $body = [
                'token' => $oprToken,
                'confirm_token' => $otpCode,
            ];

            PaymentLogger::apiRequest('paydunya', 'POST', $url, $body);

            $response = Http::timeout(10)->withHeaders($this->headers())->post($url, $body);
            $data = $response->json() ?? [];

            PaymentLogger::apiResponse('paydunya', $response->status(), $data, $url);

            if (! $response->successful()) {
                $result = PaymentResult::failed('paydunya', 'OPR charge: HTTP ' . $response->status());
                PaymentLogger::result($result);

                return $result;
            }

            $responseCode = $data['response_code'] ?? '';
            $responseText = $data['response_text'] ?? '';

            if ($responseCode === '00') {
                $invoiceData = $data['invoice_data'] ?? [];

                $result = PaymentResult::processing('paydunya', $invoiceData['token'] ?? $oprToken, [
                    'flow' => 'opr_charged',
                    'raw' => $data,
                ]);
                PaymentLogger::result($result);

                return $result;
            }

            $result = PaymentResult::failed('paydunya', $responseText ?: 'OPR charge failed');
            PaymentLogger::result($result);

            return $result;
        } catch (\Exception $e) {
            PaymentLogger::error('paydunya', "OPR charge: {$e->getMessage()}");

            return PaymentResult::failed('paydunya', $e->getMessage());
        }
    }

    public function checkStatus(string $providerRef): string
    {
        try {
            $url = "{$this->baseUrl}/checkout-invoice/confirm/{$providerRef}";

            $response = Http::timeout(10)->withHeaders($this->headers())->get($url);
            $data = $response->json() ?? [];
            $status = $data['status'] ?? '';

            $mapped = match ($status) {
                'completed' => 'paid',
                'failed', 'cancelled' => 'failed',
                default => 'pending',
            };

            PaymentLogger::statusCheck('paydunya', $providerRef, "HTTP {$response->status()} raw={$status} → {$mapped}");

            return $mapped;
        } catch (\Exception $e) {
            PaymentLogger::error('paydunya', "checkStatus: {$e->getMessage()}", ['ref' => $providerRef]);

            return 'pending';
        }
    }

    public function parseWebhook(array $payload, array $headers): ?array
    {
        $data = $payload['data'] ?? $payload;
        $status = $data['status'] ?? '';
        $ref = $data['invoice']['token'] ?? $data['token'] ?? null;

        if (! $ref) {
            return null;
        }

        return [
            'ref' => (string) $ref,
            'status' => match ($status) {
                'completed' => 'paid',
                'failed', 'cancelled' => 'failed',
                default => 'pending',
            },
        ];
    }

    private function headers(): array
    {
        return [
            'Content-Type' => 'application/json',
            'PAYDUNYA-MASTER-KEY' => $this->masterKey,
            'PAYDUNYA-PUBLIC-KEY' => $this->publicKey,
            'PAYDUNYA-PRIVATE-KEY' => $this->privateKey,
            'PAYDUNYA-TOKEN' => $this->token,
        ];
    }

    private function cleanPhone(string $phone): string
    {
        return preg_replace('/[^0-9]/', '', $phone);
    }
}
