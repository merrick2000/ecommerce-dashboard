<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FacebookConversionApi
{
    private const API_VERSION = 'v21.0';
    private const BASE_URL = 'https://graph.facebook.com';

    public function sendEvent(
        string $pixelId,
        string $accessToken,
        ?string $testEventCode,
        string $eventName,
        string $eventId,
        array $customData,
        ?string $email,
        ?string $ipAddress,
        ?string $userAgent,
    ): void {
        $userData = array_filter([
            'client_ip_address' => $ipAddress,
            'client_user_agent' => $userAgent,
            'em' => $email ? [hash('sha256', strtolower(trim($email)))] : null,
        ]);

        $eventData = [
            'event_name' => $eventName,
            'event_time' => time(),
            'event_id' => $eventId,
            'action_source' => 'website',
            'user_data' => $userData,
            'custom_data' => $customData,
        ];

        $payload = [
            'data' => [json_encode([$eventData])],
            'access_token' => $accessToken,
        ];

        if ($testEventCode) {
            $payload['test_event_code'] = $testEventCode;
        }

        $url = self::BASE_URL . '/' . self::API_VERSION . '/' . $pixelId . '/events';

        $response = Http::post($url, $payload);

        if (! $response->successful()) {
            Log::warning('Facebook CAPI error', [
                'pixel_id' => $pixelId,
                'event' => $eventName,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
        }
    }
}
