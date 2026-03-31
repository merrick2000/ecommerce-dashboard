<?php

namespace App\Services\Payment;

use Illuminate\Support\Facades\Log;

class PaymentLogger
{
    private static function log(string $level, string $emoji, string $message, array $context = []): void
    {
        $line = "{$emoji} [PAYMENT] {$message}";

        if (! empty($context)) {
            $line .= ' ' . json_encode($context, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        }

        Log::channel('payment')->{$level}($line);
    }

    public static function initiating(string $provider, int $orderId, string $country, string $network, string $phone): void
    {
        self::log('info', '🚀', "INITIATE {$provider}", [
            'order_id' => $orderId,
            'country' => $country,
            'network' => $network,
            'phone' => $phone,
        ]);
    }

    public static function apiRequest(string $provider, string $method, string $url, array $body = []): void
    {
        self::log('debug', '➡️', "{$provider} REQUEST {$method} {$url}", [
            'body' => $body,
        ]);
    }

    public static function apiResponse(string $provider, int $httpStatus, array $body, string $url = ''): void
    {
        $emoji = $httpStatus >= 200 && $httpStatus < 300 ? '✅' : '❌';

        self::log('debug', $emoji, "{$provider} RESPONSE HTTP {$httpStatus}" . ($url ? " {$url}" : ''), [
            'body' => $body,
        ]);
    }

    public static function result(PaymentResult $result): void
    {
        if ($result->success) {
            self::log('info', '🎯', "RESULT [{$result->providerName}] status={$result->status} ref={$result->providerRef}", [
                'redirect_url' => $result->redirectUrl,
                'meta' => array_diff_key($result->meta, ['raw' => true]),
            ]);
        } else {
            self::log('warning', '💥', "FAILED [{$result->providerName}] {$result->errorMessage}");
        }
    }

    public static function fallback(string $failedProvider, string $nextProvider, int $orderId, string $error): void
    {
        self::log('warning', '🔄', "FALLBACK order={$orderId} {$failedProvider} → {$nextProvider}", [
            'error' => $error,
        ]);
    }

    public static function otpConfirm(string $provider, int $orderId, string $flow): void
    {
        self::log('info', '🔑', "OTP CONFIRM [{$provider}] order={$orderId} flow={$flow}");
    }

    public static function webhook(string $provider, string $ref, string $status, array $payload): void
    {
        self::log('info', '🔔', "WEBHOOK [{$provider}] ref={$ref} status={$status}", [
            'payload' => $payload,
        ]);
    }

    public static function statusCheck(string $provider, string $ref, string $status): void
    {
        self::log('debug', '🔍', "STATUS CHECK [{$provider}] ref={$ref} → {$status}");
    }

    public static function info(string $provider, string $message, array $context = []): void
    {
        self::log('info', 'ℹ️', "[{$provider}] {$message}", $context);
    }

    public static function error(string $provider, string $message, array $context = []): void
    {
        self::log('error', '🔥', "ERROR [{$provider}] {$message}", $context);
    }
}
