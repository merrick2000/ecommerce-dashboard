<?php

namespace App\Providers;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->logEnvironmentStatus();
    }

    private function logEnvironmentStatus(): void
    {
        if (app()->runningInConsole() && ! app()->runningUnitTests()) {
            // Seulement au boot (artisan serve, queue:work, migrate, etc.)
        } else if (! app()->runningInConsole()) {
            // Requête HTTP — on log aussi
        } else {
            return;
        }

        $vars = [
            // App
            'APP_ENV' => env('APP_ENV'),
            'APP_KEY' => env('APP_KEY') ? '***set***' : null,
            'APP_DEBUG' => env('APP_DEBUG'),
            'APP_URL' => env('APP_URL'),

            // Database
            'DB_CONNECTION' => env('DB_CONNECTION'),
            'DATABASE_URL' => env('DATABASE_URL') ? '***set***' : null,
            'DB_HOST' => env('DB_HOST'),
            'DB_DATABASE' => env('DB_DATABASE'),

            // Redis
            'REDIS_URL' => env('REDIS_URL') ? '***set***' : null,
            'REDIS_CLIENT' => env('REDIS_CLIENT'),
            'REDIS_HOST' => env('REDIS_HOST'),
            'QUEUE_CONNECTION' => env('QUEUE_CONNECTION'),
            'CACHE_STORE' => env('CACHE_STORE'),

            // Storage S3
            'AWS_BUCKET' => env('AWS_BUCKET'),
            'AWS_ENDPOINT' => env('AWS_ENDPOINT'),
            'AWS_ACCESS_KEY_ID' => env('AWS_ACCESS_KEY_ID') ? '***set***' : null,
            'AWS_SECRET_ACCESS_KEY' => env('AWS_SECRET_ACCESS_KEY') ? '***set***' : null,

            // Frontend
            'FRONTEND_URL' => env('FRONTEND_URL'),

            // Filesystem
            'FILESYSTEM_DISK' => env('FILESYSTEM_DISK'),
        ];

        $lines = [];
        $missing = [];

        foreach ($vars as $key => $value) {
            if ($value !== null && $value !== '' && $value !== false) {
                $lines[] = "  ✓ {$key} = {$value}";
            } else {
                $lines[] = "  ✗ {$key} — NOT SET";
                $missing[] = $key;
            }
        }

        $status = empty($missing) ? 'All environment variables are set' : count($missing) . ' variable(s) missing';

        Log::info("🚀 Boot environment check ({$status})\n" . implode("\n", $lines));

        if (! empty($missing)) {
            Log::warning('Missing environment variables: ' . implode(', ', $missing));
        }
    }
}
