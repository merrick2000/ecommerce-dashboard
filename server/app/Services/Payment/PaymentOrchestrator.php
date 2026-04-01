<?php

namespace App\Services\Payment;

use App\Models\Order;
use App\Models\PaymentSetting;
use App\Models\PaymentTransaction;
use App\Services\Payment\Providers\FedaPayProvider;
use App\Services\Payment\Providers\FeexPayProvider;
use App\Services\Payment\Providers\ChariowProvider;
use App\Services\Payment\Providers\MaketouProvider;
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

        // Chariow (pas de sandbox — toujours la config live)
        if ($this->settings->isProviderEnabled('chariow')) {
            $cfg = ($this->settings->providers ?? [])['chariow']['live'] ?? [];
            $this->registerProvider(new ChariowProvider(
                apiKey: $cfg['api_key'] ?? '',
                webhookSecret: $cfg['webhook_secret'] ?? '',
            ));
        }

        // Maketou (pas de sandbox — toujours la config live)
        if ($this->settings->isProviderEnabled('maketou')) {
            $cfg = ($this->settings->providers ?? [])['maketou']['live'] ?? [];
            $this->registerProvider(new MaketouProvider(
                apiKey: $cfg['api_key'] ?? '',
            ));
        }
    }

    private function registerProvider(PaymentProviderInterface $provider): void
    {
        $this->providers[$provider->name()] = $provider;
    }

    public function getProvider(string $name): ?PaymentProviderInterface
    {
        return $this->providers[$name] ?? null;
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
            // Afrique de l'Ouest
            'BJ' => 'Bénin',
            'BF' => 'Burkina Faso',
            'CI' => 'Côte d\'Ivoire',
            'GH' => 'Ghana',
            'GN' => 'Guinée',
            'GW' => 'Guinée-Bissau',
            'LR' => 'Libéria',
            'ML' => 'Mali',
            'MR' => 'Mauritanie',
            'NE' => 'Niger',
            'NG' => 'Nigeria',
            'SN' => 'Sénégal',
            'SL' => 'Sierra Leone',
            'TG' => 'Togo',
            // Afrique Centrale
            'CM' => 'Cameroun',
            'CF' => 'Centrafrique',
            'CG' => 'Congo-Brazzaville',
            'GA' => 'Gabon',
            'GQ' => 'Guinée équatoriale',
            'TD' => 'Tchad',
            'CD' => 'RD Congo',
            // Afrique de l'Est
            'BI' => 'Burundi',
            'DJ' => 'Djibouti',
            'ET' => 'Éthiopie',
            'KE' => 'Kenya',
            'MG' => 'Madagascar',
            'MU' => 'Maurice',
            'RW' => 'Rwanda',
            'SO' => 'Somalie',
            'TZ' => 'Tanzanie',
            'UG' => 'Ouganda',
            // Afrique Australe
            'AO' => 'Angola',
            'BW' => 'Botswana',
            'LS' => 'Lesotho',
            'MW' => 'Malawi',
            'MZ' => 'Mozambique',
            'NA' => 'Namibie',
            'ZA' => 'Afrique du Sud',
            'ZM' => 'Zambie',
            'ZW' => 'Zimbabwe',
            // Afrique du Nord
            'DZ' => 'Algérie',
            'EG' => 'Égypte',
            'LY' => 'Libye',
            'MA' => 'Maroc',
            'TN' => 'Tunisie',
            // Autres
            'FR' => 'France',
            'BE' => 'Belgique',
            'CA' => 'Canada',
            'US' => 'États-Unis',
            'GB' => 'Royaume-Uni',
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
            'airteltigo' => 'AirtelTigo',
            'telecel' => 'Telecel',
            'africell' => 'Africell',
            'vodacom' => 'Vodacom M-Pesa',
            'mpesa' => 'M-Pesa',
            'telebirr' => 'Telebirr',
            'tigo' => 'Tigo Pesa',
            'halopesa' => 'Halopesa',
            'tnm' => 'TNM Mpamba',
            'movitel' => 'Movitel e-Mola',
            'zamtel' => 'Zamtel',
        ];

        $hasUniversalProvider = isset($this->providers['chariow']) || isset($this->providers['maketou']);

        foreach ($routing as $code => $networks) {
            $availableNetworks = [];

            foreach ($networks as $network => $providerList) {
                foreach ($providerList as $providerName) {
                    if (isset($this->providers[$providerName])) {
                        $availableNetworks[$network] = $networkNames[$network] ?? $network;
                        break;
                    }
                }
            }

            // Ajouter le réseau "redirect" si des providers universels sont actifs
            if ($hasUniversalProvider) {
                $availableNetworks['redirect'] = 'Paiement en ligne';
            }

            if (! empty($availableNetworks)) {
                $countries[$code] = [
                    'name' => $countryNames[$code] ?? $code,
                    'networks' => $availableNetworks,
                ];
            }
        }

        // Ajouter les pays qui ne sont pas dans le routing mais sont dans la liste
        if ($hasUniversalProvider) {
            foreach ($countryNames as $code => $name) {
                if (! isset($countries[$code])) {
                    $countries[$code] = [
                        'name' => $name,
                        'networks' => ['redirect' => 'Paiement en ligne'],
                    ];
                }
            }
        }

        // Trier par nom
        uasort($countries, fn ($a, $b) => strcmp($a['name'], $b['name']));

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

                // Tracker l'initiation du paiement (sauf owner)
                $order->load('store.user');
                if (! $this->isOwnerOrder($order)) {
                    \App\Models\PageEvent::create([
                        'store_id' => $order->store_id,
                        'product_id' => $order->product_id,
                        'event_type' => 'payment_started',
                        'session_id' => 'server_' . $order->id,
                        'ip_hash' => hash('sha256', request()->ip() ?? ''),
                    ]);
                }

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
        $providers = $routing[$country][$network] ?? [];

        // Chariow et Maketou sont des checkouts hébergés universels (pas de limite de pays).
        // On les ajoute automatiquement en fallback s'ils sont activés et pas déjà dans la liste.
        foreach (['chariow', 'maketou'] as $universal) {
            if (isset($this->providers[$universal]) && ! in_array($universal, $providers)) {
                $providers[] = $universal;
            }
        }

        return $providers;
    }

    private function isOwnerOrder(Order $order): bool
    {
        $ownerEmail = $order->store->user?->email;

        return $ownerEmail && strtolower($order->customer_email) === strtolower($ownerEmail);
    }

    private function dispatchTrackingEvent(Order $order): void
    {
        $order->load(['store.checkoutConfig', 'store.user', 'product']);

        // Skip tracking pour les commandes du propriétaire
        if ($this->isOwnerOrder($order)) {
            PaymentLogger::info('tracking', "Skipping tracking for owner order #{$order->id}");
            // On dispatch quand même les emails
            $this->dispatchOrderEmails($order);
            return;
        }

        // Tracker le paiement complété dans page_events
        \App\Models\PageEvent::create([
            'store_id' => $order->store_id,
            'product_id' => $order->product_id,
            'event_type' => 'payment_completed',
            'session_id' => 'server_' . $order->id,
            'ip_hash' => hash('sha256', request()->ip() ?? ''),
        ]);

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

        // PostHog server-side
        \App\Services\PostHogService::capture(
            $order->customer_email,
            'payment_completed',
            [
                'source' => 'native',
                'store_id' => $order->store_id,
                'product_id' => $order->product_id,
                'product_name' => $order->product->name,
                'amount' => $order->amount,
                'currency' => $order->currency,
            ]
        );

        // Email notifications (queued, non-bloquant)
        $this->dispatchOrderEmails($order);
    }

    private function dispatchOrderEmails(Order $order): void
    {
        try {
            $store = $order->store;
            $product = $order->product;
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
            $downloadUrl = $frontendUrl . '/' . $store->slug . '/success?order=' . $order->id;

            $locale = $store->locale ?? 'fr';

            PaymentLogger::info('email', "Dispatching order emails for order #{$order->id} to {$order->customer_email}");

            // Email de confirmation au client
            \Illuminate\Support\Facades\Mail::to($order->customer_email)
                ->queue(new \App\Mail\OrderConfirmationMail(
                    order: $order,
                    downloadUrl: $downloadUrl,
                    storeName: $store->name,
                    productName: $product->name,
                    storeLocale: $locale,
                ));

            PaymentLogger::info('email', "OrderConfirmationMail queued for {$order->customer_email}");

            // Notification de vente au vendeur
            $sellerEmail = $store->user?->email;
            if ($sellerEmail) {
                \Illuminate\Support\Facades\Mail::to($sellerEmail)
                    ->queue(new \App\Mail\NewSaleNotificationMail(
                        order: $order,
                        productName: $product->name,
                        storeName: $store->name,
                    ));

                PaymentLogger::info('email', "NewSaleNotificationMail queued for {$sellerEmail}");
            }
        } catch (\Exception $e) {
            PaymentLogger::error('email', 'Failed to dispatch order emails: ' . $e->getMessage(), [
                'order_id' => $order->id,
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }
}
