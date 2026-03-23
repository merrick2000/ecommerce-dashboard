<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentSetting extends Model
{
    protected $fillable = ['mode', 'providers', 'webhook_secret'];

    protected function casts(): array
    {
        return [
            'providers' => 'array',
        ];
    }

    /**
     * Récupère l'instance unique (singleton).
     */
    public static function instance(): self
    {
        return self::firstOrCreate([], [
            'mode' => 'sandbox',
            'providers' => [
                'feexpay' => ['enabled' => false, 'sandbox' => [], 'live' => []],
                'fedapay' => ['enabled' => false, 'sandbox' => [], 'live' => []],
                'paydunya' => ['enabled' => false, 'sandbox' => [], 'live' => []],
                'pawapay' => ['enabled' => false, 'sandbox' => [], 'live' => []],
            ],
        ]);
    }

    /**
     * Retourne true si on est en mode live.
     */
    public function isLive(): bool
    {
        return $this->mode === 'live';
    }

    /**
     * Retourne la config active (sandbox ou live) d'un provider.
     */
    public function getProviderConfig(string $provider): array
    {
        $providers = $this->providers ?? [];
        $config = $providers[$provider] ?? [];

        if (empty($config['enabled'])) {
            return [];
        }

        return $config[$this->mode] ?? [];
    }

    /**
     * Vérifie si un provider est activé.
     */
    public function isProviderEnabled(string $provider): bool
    {
        $providers = $this->providers ?? [];

        return ! empty($providers[$provider]['enabled']);
    }
}
