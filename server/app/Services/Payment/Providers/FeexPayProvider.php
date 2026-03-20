<?php

namespace App\Services\Payment\Providers;

use App\Models\Order;
use App\Services\Payment\PaymentLogger;
use App\Services\Payment\PaymentProviderInterface;
use App\Services\Payment\PaymentResult;
use Illuminate\Support\Facades\Http;

class FeexPayProvider implements PaymentProviderInterface
{
    private const ENDPOINTS = [
        'BJ_mtn' => 'transactions/public/requesttopay/mtn',
        'BJ_moov' => 'transactions/public/requesttopay/moov',
        'BJ_celtiis' => 'transactions/public/requesttopay/celtiis_bj',
        'CI_mtn' => 'transactions/public/requesttopay/mtn_ci',
        'CI_moov' => 'transactions/public/requesttopay/moov_ci',
        'CI_orange' => 'transactions/public/requesttopay/orange_ci',
        'CI_wave' => 'transactions/public/requesttopay/wave_ci',
        'SN_orange' => 'transactions/public/requesttopay/orange_sn',
        'SN_free' => 'transactions/public/requesttopay/free_sn',
        'TG_tmoney' => 'transactions/public/requesttopay/togocom_tg',
        'TG_moov' => 'transactions/public/requesttopay/moov_tg',
        'CG_mtn' => 'transactions/public/requesttopay/mtn_cg',
    ];

    private const DIRECT_PUSH = [
        'BJ_mtn', 'BJ_moov', 'BJ_celtiis',
        'CI_mtn', 'CI_moov',
        'TG_tmoney',
        'CG_mtn',
    ];

    private const REQUIRES_PRE_OTP = ['SN_orange'];

    private const SUPPORTED = [
        'BJ' => ['mtn', 'moov', 'celtiis'],
        'TG' => ['tmoney', 'moov'],
        'SN' => ['orange', 'free'],
        'CI' => ['mtn', 'moov', 'wave', 'orange'],
        'CG' => ['mtn'],
    ];

    public function __construct(
        private string $apiKey,
        private string $shopId,
        private string $baseUrl = 'https://api.feexpay.me/api',
        private ?string $callbackUrl = null,
    ) {
        $this->baseUrl = rtrim($this->baseUrl, '/');
    }

    public function name(): string
    {
        return 'feexpay';
    }

    public function supports(string $country, string $network): bool
    {
        return isset(self::SUPPORTED[$country]) && in_array($network, self::SUPPORTED[$country]);
    }

    public function initiate(Order $order, string $phone, string $country, string $network): PaymentResult
    {
        $key = "{$country}_{$network}";

        if (! isset(self::ENDPOINTS[$key])) {
            $result = PaymentResult::failed('feexpay', "Combinaison non supportée : {$country}/{$network}");
            PaymentLogger::result($result);

            return $result;
        }

        if (in_array($key, self::REQUIRES_PRE_OTP)) {
            $result = PaymentResult::otpRequired('feexpay', 'feexpay_pending_' . $order->id, [
                'flow' => 'feexpay_pre_otp',
                'country' => $country,
                'network' => $network,
                'phone' => $phone,
                'ussd_instruction' => '#144*' . (int) $order->amount . '*' . $this->cleanPhone($phone) . '#',
            ]);
            PaymentLogger::result($result);

            return $result;
        }

        return $this->executePayment($order, $phone, $country, $network);
    }

    public function completeWithOtp(Order $order, string $phone, string $country, string $network, string $otp): PaymentResult
    {
        PaymentLogger::otpConfirm('feexpay', $order->id, "orange_sn otp_length=" . strlen($otp));

        return $this->executePayment($order, $phone, $country, $network, $otp);
    }

    private function executePayment(Order $order, string $phone, string $country, string $network, ?string $otp = null): PaymentResult
    {
        $key = "{$country}_{$network}";
        $endpoint = self::ENDPOINTS[$key] ?? null;

        if (! $endpoint) {
            return PaymentResult::failed('feexpay', "Endpoint inconnu : {$key}");
        }

        try {
            $body = [
                'shop' => $this->shopId,
                'amount' => (int) $order->amount,
                'phoneNumber' => $this->cleanPhone($phone),
            ];

            if ($key === 'SN_orange' && $otp) {
                $body['otp'] = $otp;
            }

            if ($key === 'SN_free' && $this->callbackUrl) {
                $body['return_url'] = $this->callbackUrl;
            }

            $url = "{$this->baseUrl}/{$endpoint}";

            PaymentLogger::apiRequest('feexpay', 'POST', $url, $body);

            $response = Http::timeout(10)->withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($url, $body);

            $data = $response->json() ?? [];

            PaymentLogger::apiResponse('feexpay', $response->status(), $data, $url);

            if (! $response->successful()) {
                $result = PaymentResult::failed('feexpay', 'HTTP ' . $response->status() . ': ' . $response->body());
                PaymentLogger::result($result);

                return $result;
            }

            $ref = $data['reference'] ?? $data['id'] ?? ('feex_' . $order->id);

            if (! empty($data['payment_url'])) {
                $result = PaymentResult::redirect('feexpay', (string) $ref, $data['payment_url']);
                PaymentLogger::result($result);

                return $result;
            }

            $result = PaymentResult::processing('feexpay', (string) $ref, [
                'flow' => in_array($key, self::DIRECT_PUSH) ? 'direct_push' : 'web',
                'network' => $network,
                'country' => $country,
                'raw' => $data,
            ]);
            PaymentLogger::result($result);

            return $result;
        } catch (\Exception $e) {
            PaymentLogger::error('feexpay', $e->getMessage(), [
                'order_id' => $order->id,
                'key' => $key,
            ]);

            return PaymentResult::failed('feexpay', $e->getMessage());
        }
    }

    public function checkStatus(string $providerRef): string
    {
        try {
            $url = "{$this->baseUrl}/transactions/{$providerRef}/status";

            $response = Http::timeout(5)->withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
            ])->get($url);

            $data = $response->json() ?? [];
            $status = strtoupper($data['status'] ?? '');

            $mapped = match ($status) {
                'SUCCESSFUL', 'SUCCESS' => 'paid',
                'FAILED', 'CANCELLED' => 'failed',
                default => 'pending',
            };

            PaymentLogger::statusCheck('feexpay', $providerRef, "HTTP {$response->status()} raw={$status} → {$mapped}");

            return $mapped;
        } catch (\Exception $e) {
            PaymentLogger::error('feexpay', "checkStatus failed: {$e->getMessage()}", ['ref' => $providerRef]);

            return 'pending';
        }
    }

    public function parseWebhook(array $payload, array $headers): ?array
    {
        $ref = $payload['reference'] ?? $payload['id'] ?? null;
        $status = strtoupper($payload['status'] ?? '');

        if (! $ref) {
            return null;
        }

        return [
            'ref' => (string) $ref,
            'status' => match ($status) {
                'SUCCESSFUL', 'SUCCESS' => 'paid',
                'FAILED', 'CANCELLED' => 'failed',
                default => 'pending',
            },
        ];
    }

    public function verifyWebhookSignature(string $rawPayload, array $headers, string $webhookSecret): bool
    {
        $signature = $headers['x-fedapay-signature'] ?? $headers['X-FEDAPAY-SIGNATURE'] ?? null;
        $timestamp = $headers['x-timestamp'] ?? $headers['X-Timestamp'] ?? '';

        if (! $signature) {
            return false;
        }

        $expected = hash_hmac('sha256', $rawPayload . $timestamp, $webhookSecret);

        return hash_equals($expected, $signature);
    }

    private function cleanPhone(string $phone): string
    {
        return preg_replace('/[^0-9]/', '', $phone);
    }
}
