<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\PaymentSetting;
use App\Models\PaymentTransaction;
use App\Services\Payment\Providers\FedaPayProvider;
use App\Services\Payment\Providers\FeexPayProvider;
use App\Services\Payment\Providers\PawaPayProvider;
use App\Services\Payment\Providers\PayDunyaProvider;
use Illuminate\Support\Facades\Log;
use App\Services\Payment\PaymentLogger;

class PaymentOrchestrator
{
    /** @var array<string, PaymentProviderInterface> */
    private array $providers = [];

    private PaymentSetting $settings;

    public function __construct()
    {
        $this->settings = PaymentSetting::instance();
        $this->bootProviders();
    }

    /**
     * Initialise les providers avec la config active (sandbox ou live) depuis la DB.
     */
    private function bootProviders(): void
    {
        $mode = $this->settings->mode;

        // FeexPay
        if ($this->settings->isProviderEnabled('feexpay')) {
            $cfg = $this->settings->getProviderConfig('feexpay');
            $baseUrl = $mode === 'live'
                ? 'https://api.feexpay.me/api'
                : 'https://api.feexpay.me/api'; // FeexPay utilise la même URL, la clé détermine l'env
            $this->registerProvider(new FeexPayProvider(
                apiKey: $cfg['api_key'] ?? '',
                shopId: $cfg['shop_id'] ?? '',
                baseUrl: $baseUrl,
                callbackUrl: config('app.url') . '/api/v1/webhooks/feexpay',
            ));
        }

        // FedaPay
        if ($this->settings->isProviderEnabled('fedapay')) {
            $cfg = $this->settings->getProviderConfig('fedapay');
            $baseUrl = $mode === 'live'
                ? 'https://api.fedapay.com/v1'
                : 'https://sandbox-api.fedapay.com/v1';
            $this->registerProvider(new FedaPayProvider(
                apiKey: $cfg['api_key'] ?? '',
                baseUrl: $baseUrl,
                webhookSecret: $cfg['webhook_secret'] ?? null,
            ));
        }

        // PayDunya
        if ($this->settings->isProviderEnabled('paydunya')) {
            $cfg = $this->settings->getProviderConfig('paydunya');
            $baseUrl = $mode === 'live'
                ? 'https://app.paydunya.com/api/v1'
                : 'https://app.paydunya.com/sandbox-api/v1';
            $this->registerProvider(new PayDunyaProvider(
                masterKey: $cfg['master_key'] ?? '',
                publicKey: $cfg['public_key'] ?? '',
                privateKey: $cfg['private_key'] ?? '',
                token: $cfg['token'] ?? '',
                baseUrl: $baseUrl,
            ));
        }

        // PawaPay
        if ($this->settings->isProviderEnabled('pawapay')) {
            $cfg = $this->settings->getProviderConfig('pawapay');
            $baseUrl = $mode === 'live'
                ? 'https://api.pawapay.cloud'
                : 'https://api.sandbox.pawapay.cloud';
            $this->registerProvider(new PawaPayProvider(
                apiKey: $cfg['api_key'] ?? '',
                baseUrl: $baseUrl,
            ));
        }
    }

    private function registerProvider(PaymentProviderInterface $provider): void
    {
        $this->providers[$provider->name()] = $provider;
    }

    /**
     * Retourne le mode actuel (sandbox / live).
     */
    public function mode(): string
    {
        return $this->settings->mode;
    }

    /**
     * Retourne la liste des pays et réseaux supportés pour le frontend.
     * Ne retourne que les routes dont au moins un provider est activé.
     */
    public function supportedCountries(): array
    {
        $routing = config('payment.routing', []);
        $countries = [];

        $countryNames = [
            'BJ' => 'Bénin',
            'TG' => 'Togo',
            'SN' => 'Sénégal',
            'CI' => 'Côte d\'Ivoire',
            'BF' => 'Burkina Faso',
            'CM' => 'Cameroun',
            'CG' => 'Congo',
        ];

        $networkNames = [
            'mtn' => 'MTN Mobile Money',
            'moov' => 'Moov Money',
            'celtiis' => 'Celtiis',
            'tmoney' => 'T-Money',
            'wave' => 'Wave',
            'orange' => 'Orange Money',
            'free' => 'Free Money',
            'airtel' => 'Airtel Money',
        ];

        foreach ($routing as $code => $networks) {
            $availableNetworks = [];

            foreach ($networks as $network => $providerList) {
                // Vérifier qu'au moins un provider de la liste est activé
                foreach ($providerList as $providerName) {
                    if (isset($this->providers[$providerName])) {
                        $availableNetworks[$network] = $networkNames[$network] ?? $network;
                        break;
                    }
                }
            }

            if (! empty($availableNetworks)) {
                $countries[$code] = [
                    'name' => $countryNames[$code] ?? $code,
                    'networks' => $availableNetworks,
                ];
            }
        }

        return $countries;
    }

    /**
     * Initie un paiement avec fallback automatique entre providers.
     */
    public function initiate(Order $order, string $phone, string $country, string $network): PaymentResult
    {
        $providerOrder = $this->resolveProviders($country, $network);

        if (empty($providerOrder)) {
            PaymentLogger::error('none', "No provider for {$country}/{$network}");

            return PaymentResult::failed('none', "Aucun provider disponible pour {$country}/{$network}");
        }

        $attempt = 0;

        foreach ($providerOrder as $providerName) {
            $provider = $this->providers[$providerName] ?? null;

            if (! $provider) {
                continue;
            }

            $attempt++;

            PaymentLogger::initiating($providerName, $order->id, $country, $network, $phone);

            $result = $provider->initiate($order, $phone, $country, $network);

            // Enregistrer la tentative
            $txStatus = $result->success
                ? ($result->status === 'otp_required' ? 'otp_required' : 'processing')
                : 'failed';

            PaymentTransaction::create([
                'order_id' => $order->id,
                'provider' => $providerName,
                'provider_ref' => $result->providerRef,
                'country' => $country,
                'network' => $network,
                'phone' => $phone,
                'status' => $txStatus,
                'amount' => $order->amount,
                'currency' => $order->currency,
                'provider_response' => array_merge(
                    $result->meta['raw'] ?? [],
                    isset($result->meta['opr_token']) ? ['opr_token' => $result->meta['opr_token']] : [],
                    isset($result->meta['flow']) ? ['flow' => $result->meta['flow']] : [],
                ),
                'error_message' => $result->errorMessage,
                'attempt_number' => $attempt,
            ]);

            if ($result->success) {
                $order->update([
                    'payment_method' => $providerName,
                    'payment_ref' => $result->providerRef,
                ]);

                return $result;
            }

            // Fallback : log et essayer le suivant
            $nextIndex = array_search($providerName, $providerOrder) + 1;
            $nextProvider = $providerOrder[$nextIndex] ?? 'none';
            PaymentLogger::fallback($providerName, $nextProvider, $order->id, $result->errorMessage ?? 'unknown');
        }

        PaymentLogger::error('all', "All providers failed for order #{$order->id}");

        return PaymentResult::failed('all', 'Tous les providers de paiement ont échoué. Veuillez réessayer.');
    }

    /**
     * Confirme un paiement OTP (PayDunya OPR ou FeexPay Orange SN).
     */
    public function confirmOtp(Order $order, string $otpCode): PaymentResult
    {
        $transaction = PaymentTransaction::where('order_id', $order->id)
            ->where('status', 'otp_required')
            ->latest()
            ->first();

        if (! $transaction) {
            return PaymentResult::failed('unknown', 'Aucune transaction en attente de code OTP.');
        }

        $provider = $this->providers[$transaction->provider] ?? null;

        if (! $provider) {
            return PaymentResult::failed($transaction->provider, 'Provider non disponible pour OTP.');
        }

        $flow = $transaction->provider_response['flow'] ?? '';

        // FeexPay Orange SN : le code OTP est envoyé avec la requête de paiement
        if ($provider instanceof Providers\FeexPayProvider && $flow === 'feexpay_pre_otp') {
            $result = $provider->completeWithOtp(
                $order,
                $transaction->phone,
                $transaction->country,
                $transaction->network,
                $otpCode,
            );

            if ($result->success) {
                $transaction->update([
                    'status' => 'processing',
                    'provider_ref' => $result->providerRef,
                    'provider_response' => array_merge(
                        $transaction->provider_response ?? [],
                        ['otp_confirmed' => true],
                        $result->meta['raw'] ?? [],
                    ),
                ]);

                $order->update([
                    'payment_method' => 'feexpay',
                    'payment_ref' => $result->providerRef,
                ]);
            } else {
                $transaction->update(['error_message' => $result->errorMessage]);
            }

            return $result;
        }

        // PayDunya OPR : confirmer avec le token OPR
        if ($provider instanceof Providers\PayDunyaProvider) {
            $oprToken = $transaction->provider_response['opr_token'] ?? null;

            if (! $oprToken) {
                return PaymentResult::failed('paydunya', 'OPR token manquant.');
            }

            $result = $provider->confirmOtp($oprToken, $otpCode);

            if ($result->success) {
                $transaction->update([
                    'status' => 'processing',
                    'provider_response' => array_merge(
                        $transaction->provider_response ?? [],
                        ['opr_charged' => true],
                        $result->meta['raw'] ?? [],
                    ),
                ]);

                // Vérifier immédiatement le statut
                $status = $provider->checkStatus($transaction->provider_ref);

                if ($status === 'paid') {
                    $transaction->update(['status' => 'paid']);
                    $order->update(['status' => 'paid']);
                    $this->dispatchTrackingEvent($order);
                }
            } else {
                $transaction->update(['error_message' => $result->errorMessage]);
            }

            return $result;
        }

        return PaymentResult::failed($transaction->provider, 'Provider ne supporte pas la confirmation OTP.');
    }

    /**
     * Vérifie le statut d'un paiement via le provider.
     */
    public function checkStatus(Order $order): string
    {
        $transaction = PaymentTransaction::where('order_id', $order->id)
            ->whereIn('status', ['processing', 'pending', 'otp_required'])
            ->latest()
            ->first();

        if (! $transaction || ! $transaction->provider_ref) {
            return $order->status->value;
        }

        $provider = $this->providers[$transaction->provider] ?? null;

        if (! $provider) {
            return $order->status->value;
        }

        $status = $provider->checkStatus($transaction->provider_ref);

        if ($status !== $transaction->status) {
            $transaction->update(['status' => $status]);

            if ($status === 'paid') {
                $order->update(['status' => 'paid']);
                $this->dispatchTrackingEvent($order);
            } elseif ($status === 'failed') {
                $transaction->update(['status' => 'failed']);
            }
        }

        return $status;
    }

    /**
     * Traite un webhook entrant pour un provider donné.
     */
    public function handleWebhook(string $providerName, array $payload, array $headers): bool
    {
        PaymentLogger::webhook($providerName, 'incoming', 'received', $payload);

        $provider = $this->providers[$providerName] ?? null;

        if (! $provider) {
            PaymentLogger::error($providerName, 'Webhook received but provider not active');

            return false;
        }

        $parsed = $provider->parseWebhook($payload, $headers);

        if (! $parsed) {
            PaymentLogger::error($providerName, 'Could not parse webhook payload', ['payload' => $payload]);

            return false;
        }

        $ref = $parsed['ref'];
        $status = $parsed['status'];

        PaymentLogger::webhook($providerName, $ref, $status, $payload);

        $transaction = PaymentTransaction::where('provider', $providerName)
            ->where('provider_ref', $ref)
            ->latest()
            ->first();

        if (! $transaction) {
            PaymentLogger::error($providerName, "No transaction found for ref {$ref}");

            return false;
        }

        $transaction->update([
            'webhook_payload' => $payload,
            'status' => $status,
        ]);

        $order = $transaction->order;

        if ($status === 'paid' && $order->status->value !== 'paid') {
            $order->update(['status' => 'paid']);

            PaymentLogger::webhook($providerName, $ref, 'CONFIRMED_PAID', [
                'order_id' => $order->id,
            ]);

            $this->dispatchTrackingEvent($order);
        }

        return true;
    }

    public function getPayDunyaConfirmationResponse(): string
    {
        $cfg = $this->settings->getProviderConfig('paydunya');

        return ($cfg['token'] ?? '') . ':' . ($cfg['master_key'] ?? '');
    }

    private function resolveProviders(string $country, string $network): array
    {
        $routing = config('payment.routing', []);

        return $routing[$country][$network] ?? [];
    }

    private function dispatchTrackingEvent(Order $order): void
    {
        $order->load(['store.checkoutConfig', 'product']);

        $trackingConfig = $order->store->checkoutConfig?->tracking_config;

        if (
            $trackingConfig &&
            ! empty($trackingConfig['facebook_pixel_id']) &&
            ! empty($trackingConfig['facebook_access_token'])
        ) {
            \App\Jobs\SendFacebookConversionEvent::dispatch(
                $trackingConfig['facebook_pixel_id'],
                $trackingConfig['facebook_access_token'],
                $trackingConfig['facebook_test_event_code'] ?? null,
                'Purchase',
                \Illuminate\Support\Str::uuid()->toString(),
                [
                    'value' => $order->amount,
                    'currency' => $order->currency,
                    'content_name' => $order->product->name,
                    'content_ids' => [(string) $order->product->id],
                    'content_type' => 'product',
                ],
                $order->customer_email,
                request()->ip(),
                request()->userAgent(),
            );
        }
    }
}
