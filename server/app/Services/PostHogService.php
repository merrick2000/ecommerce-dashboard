<?php

namespace App\Services;

use PostHog\PostHog;

class PostHogService
{
    protected static bool $initialized = false;

    public static function init(): void
    {
        if (static::$initialized) {
            return;
        }

        $key = config('services.posthog.key');

        if (! $key) {
            return;
        }

        PostHog::init($key, [
            'host' => config('services.posthog.host', 'https://us.i.posthog.com'),
        ]);

        static::$initialized = true;
    }

    public static function capture(string $distinctId, string $event, array $properties = []): void
    {
        if (! app()->isProduction() || ! config('services.posthog.key')) {
            return;
        }

        static::init();

        PostHog::capture([
            'distinctId' => $distinctId,
            'event' => $event,
            'properties' => $properties,
        ]);
    }

    public static function identify(string $distinctId, array $properties = []): void
    {
        if (! app()->isProduction() || ! config('services.posthog.key')) {
            return;
        }

        static::init();

        PostHog::identify([
            'distinctId' => $distinctId,
            'properties' => $properties,
        ]);
    }
}
