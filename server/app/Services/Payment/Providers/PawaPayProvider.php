<?php

namespace App\Services\Payment\Providers;

use App\Models\Order;
use App\Services\Payment\PaymentLogger;
use App\Services\Payment\PaymentProviderInterface;
use App\Services\Payment\PaymentResult;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class PawaPayProvider implements PaymentProviderInterface
{
    public function __construct(
        private string $apiKey,
        private string $baseUrl = 'https://api.sandbox.pawapay.cloud',
    ) {
        $this->baseUrl = rtrim($this->baseUrl, '/');
    }

    public function name(): string
    {
        return 'pawapay';
    }

    public function supports(string $country, string $network): bool
    {
        $key = "{$country}_{$network}";

        return config("payment.pawapay_correspondents.{$key}") !== null;
    }

    public function initiate(Order $order, string $phone, string $country, string $network): PaymentResult
    {
        try {
            $depositId = Str::uuid()->toString();
            $correspondent = config("payment.pawapay_correspondents.{$country}_{$network}");

            if (! $correspondent) {
                $result = PaymentResult::failed('pawapay', "No correspondent for {$country}/{$network}");
                PaymentLogger::result($result);

                return $result;
            }

            $url = "{$this->baseUrl}/deposits";
            $body = [
                'depositId' => $depositId,
                'amount' => (string) (int) ceil($order->amount),
                'currency' => $order->currency,
                'correspondent' => $correspondent,
                'payer' => [
                    'type' => 'MSISDN',
                    'address' => [
                        'value' => $this->formatMsisdn($phone, $country),
                    ],
                ],
                'customerTimestamp' => now()->toIso8601String(),
                'statementDescription' => "Sellit #{$order->id}",
            ];

            PaymentLogger::apiRequest('pawapay', 'POST', $url, $body);

            $response = Http::timeout(10)->withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($url, $body);

            $data = $response->json() ?? [];

            PaymentLogger::apiResponse('pawapay', $response->status(), $data, $url);

            if (! $response->successful()) {
                $result = PaymentResult::failed('pawapay', 'HTTP ' . $response->status() . ': ' . $response->body());
                PaymentLogger::result($result);

                return $result;
            }

            $status = $data['status'] ?? '';

            if (in_array($status, ['ACCEPTED', 'ENQUEUED'])) {
                $result = PaymentResult::processing('pawapay', $depositId, [
                    'flow' => 'ussd_push',
                    'raw' => $data,
                ]);
                PaymentLogger::result($result);

                return $result;
            }

            $rejectionReason = $data['rejectionReason']['rejectionMessage'] ?? $status;
            $result = PaymentResult::failed('pawapay', "PawaPay rejected: {$rejectionReason}");
            PaymentLogger::result($result);

            return $result;
        } catch (\Exception $e) {
            PaymentLogger::error('pawapay', $e->getMessage(), ['order_id' => $order->id]);

            return PaymentResult::failed('pawapay', $e->getMessage());
        }
    }

    public function checkStatus(string $providerRef): string
    {
        try {
            $url = "{$this->baseUrl}/deposits/{$providerRef}";

            $response = Http::timeout(5)->withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
            ])->get($url);

            $data = $response->json() ?? [];
            $deposit = is_array($data) && isset($data[0]) ? $data[0] : $data;
            $status = $deposit['status'] ?? '';

            $mapped = match ($status) {
                'COMPLETED' => 'paid',
                'FAILED', 'REJECTED', 'CANCELLED' => 'failed',
                default => 'pending',
            };

            PaymentLogger::statusCheck('pawapay', $providerRef, "HTTP {$response->status()} raw={$status} → {$mapped}");

            return $mapped;
        } catch (\Exception $e) {
            PaymentLogger::error('pawapay', "checkStatus: {$e->getMessage()}", ['ref' => $providerRef]);

            return 'pending';
        }
    }

    public function parseWebhook(array $payload, array $headers): ?array
    {
        $ref = $payload['depositId'] ?? null;
        $status = $payload['status'] ?? '';

        if (! $ref) {
            return null;
        }

        return [
            'ref' => (string) $ref,
            'status' => match ($status) {
                'COMPLETED' => 'paid',
                'FAILED', 'REJECTED', 'CANCELLED' => 'failed',
                default => 'pending',
            },
        ];
    }

    private function formatMsisdn(string $phone, string $country): string
    {
        $clean = preg_replace('/[^0-9]/', '', $phone);

        $prefixes = [
            'BJ' => '229', 'TG' => '228', 'SN' => '221',
            'CI' => '225', 'BF' => '226', 'CG' => '242',
        ];

        $prefix = $prefixes[$country] ?? '';

        if ($prefix && ! str_starts_with($clean, $prefix)) {
            $clean = $prefix . $clean;
        }

        return $clean;
    }
}
