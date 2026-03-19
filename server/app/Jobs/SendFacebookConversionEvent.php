<?php

namespace App\Jobs;

use App\Services\FacebookConversionApi;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendFacebookConversionEvent implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 10;

    public function __construct(
        private string $pixelId,
        private string $accessToken,
        private ?string $testEventCode,
        private string $eventName,
        private string $eventId,
        private array $customData,
        private ?string $email,
        private ?string $ipAddress,
        private ?string $userAgent,
    ) {}

    public function handle(FacebookConversionApi $api): void
    {
        $api->sendEvent(
            $this->pixelId,
            $this->accessToken,
            $this->testEventCode,
            $this->eventName,
            $this->eventId,
            $this->customData,
            $this->email,
            $this->ipAddress,
            $this->userAgent,
        );
    }
}
