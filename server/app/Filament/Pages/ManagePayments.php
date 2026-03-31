<?php

namespace App\Filament\Pages;

use App\Models\PaymentSetting;
use App\Services\Payment\PaymentResult;
use App\Services\Payment\Providers\FedaPayProvider;
use App\Services\Payment\Providers\FeexPayProvider;
use App\Services\Payment\Providers\PawaPayProvider;
use App\Services\Payment\Providers\PayDunyaProvider;
use Filament\Actions;
use Filament\Actions\Concerns\InteractsWithActions;
use Filament\Actions\Contracts\HasActions;
use Filament\Forms;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Illuminate\Support\Str;

class ManagePayments extends Page implements HasActions, HasForms
{
    use InteractsWithActions;
    use InteractsWithForms;

    protected static ?string $navigationIcon = 'heroicon-o-credit-card';

    protected static ?string $navigationLabel = 'Paiements';

    protected static ?string $title = 'Paramètres de paiement';

    protected static ?int $navigationSort = 6;

    protected static string $view = 'filament.pages.manage-payments';

    public ?array $data = [];

    public function mount(): void
    {
        $settings = PaymentSetting::instance();
        $providers = $settings->providers ?? [];

        // Générer un secret webhook si absent
        if (! $settings->webhook_secret) {
            $settings->update(['webhook_secret' => 'whsec_' . Str::random(40)]);
            $settings->refresh();
        }

        $this->form->fill([
            'mode' => $settings->mode,
            'webhook_secret' => $settings->webhook_secret,
            // FeexPay
            'feexpay_enabled' => $providers['feexpay']['enabled'] ?? false,
            'feexpay_sandbox_api_key' => $providers['feexpay']['sandbox']['api_key'] ?? '',
            'feexpay_sandbox_shop_id' => $providers['feexpay']['sandbox']['shop_id'] ?? '',
            'feexpay_live_api_key' => $providers['feexpay']['live']['api_key'] ?? '',
            'feexpay_live_shop_id' => $providers['feexpay']['live']['shop_id'] ?? '',
            // FedaPay
            'fedapay_enabled' => $providers['fedapay']['enabled'] ?? false,
            'fedapay_sandbox_api_key' => $providers['fedapay']['sandbox']['api_key'] ?? '',
            'fedapay_sandbox_webhook_secret' => $providers['fedapay']['sandbox']['webhook_secret'] ?? '',
            'fedapay_live_api_key' => $providers['fedapay']['live']['api_key'] ?? '',
            'fedapay_live_webhook_secret' => $providers['fedapay']['live']['webhook_secret'] ?? '',
            // PayDunya
            'paydunya_enabled' => $providers['paydunya']['enabled'] ?? false,
            'paydunya_sandbox_master_key' => $providers['paydunya']['sandbox']['master_key'] ?? '',
            'paydunya_sandbox_public_key' => $providers['paydunya']['sandbox']['public_key'] ?? '',
            'paydunya_sandbox_private_key' => $providers['paydunya']['sandbox']['private_key'] ?? '',
            'paydunya_sandbox_token' => $providers['paydunya']['sandbox']['token'] ?? '',
            'paydunya_live_master_key' => $providers['paydunya']['live']['master_key'] ?? '',
            'paydunya_live_public_key' => $providers['paydunya']['live']['public_key'] ?? '',
            'paydunya_live_private_key' => $providers['paydunya']['live']['private_key'] ?? '',
            'paydunya_live_token' => $providers['paydunya']['live']['token'] ?? '',
            // PawaPay
            'pawapay_enabled' => $providers['pawapay']['enabled'] ?? false,
            'pawapay_sandbox_api_key' => $providers['pawapay']['sandbox']['api_key'] ?? '',
            'pawapay_sandbox_signing_key' => $providers['pawapay']['sandbox']['signing_key'] ?? '',
            'pawapay_live_api_key' => $providers['pawapay']['live']['api_key'] ?? '',
            'pawapay_live_signing_key' => $providers['pawapay']['live']['signing_key'] ?? '',
            // Chariow
            'chariow_enabled' => $providers['chariow']['enabled'] ?? false,
            'chariow_live_api_key' => $providers['chariow']['live']['api_key'] ?? '',
            'chariow_live_webhook_secret' => $providers['chariow']['live']['webhook_secret'] ?? '',
            // Maketou
            'maketou_enabled' => $providers['maketou']['enabled'] ?? false,
            'maketou_live_api_key' => $providers['maketou']['live']['api_key'] ?? '',
        ]);
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                // ─── MODE GLOBAL ─────────────────────────────────
                Forms\Components\Section::make('Mode de paiement')
                    ->description('Basculez entre sandbox (test) et live (production). En mode sandbox, aucun vrai paiement ne sera effectué.')
                    ->schema([
                        Forms\Components\ToggleButtons::make('mode')
                            ->label('Environnement')
                            ->options([
                                'sandbox' => 'Sandbox (Test)',
                                'live' => 'Live (Production)',
                            ])
                            ->icons([
                                'sandbox' => 'heroicon-o-beaker',
                                'live' => 'heroicon-o-bolt',
                            ])
                            ->colors([
                                'sandbox' => 'warning',
                                'live' => 'success',
                            ])
                            ->inline()
                            ->required()
                            ->live(),
                    ]),

                // ─── WEBHOOK EXTERNE ────────────────────────────
                Forms\Components\Section::make('Webhook externe (Selar, etc.)')
                    ->description('Configurez le webhook pour recevoir les notifications de paiement depuis n8n.')
                    ->icon('heroicon-o-link')
                    ->collapsible()
                    ->schema([
                        Forms\Components\Placeholder::make('webhook_url_display')
                            ->label('URL du webhook')
                            ->content(fn () => config('app.url') . '/api/v1/webhooks/external'),

                        Forms\Components\TextInput::make('webhook_secret')
                            ->label('Secret du webhook')
                            ->password()
                            ->revealable()
                            ->readOnly()
                            ->helperText('Copiez ce secret dans n8n (header X-Webhook-Secret). Régénérez-le si compromis.'),
                    ])
                    ->headerActions([
                        Forms\Components\Actions\Action::make('regenerate_webhook_secret')
                            ->label('Régénérer le secret')
                            ->icon('heroicon-o-arrow-path')
                            ->color('warning')
                            ->requiresConfirmation()
                            ->modalHeading('Régénérer le secret webhook')
                            ->modalDescription('L\'ancien secret sera invalidé. Pensez à mettre à jour n8n avec le nouveau secret.')
                            ->action(function (Forms\Set $set): void {
                                $newSecret = 'whsec_' . Str::random(40);
                                $settings = PaymentSetting::instance();
                                $settings->update(['webhook_secret' => $newSecret]);
                                $set('webhook_secret', $newSecret);

                                Notification::make()
                                    ->title('Secret régénéré')
                                    ->body('Copiez le nouveau secret et mettez à jour votre configuration n8n.')
                                    ->success()
                                    ->send();
                            }),
                    ]),

                // ─── FEEXPAY ─────────────────────────────────────
                Forms\Components\Section::make('FeexPay')
                    ->description('Bénin, Togo, Sénégal, Côte d\'Ivoire, Burkina, Congo — MTN, Moov, Wave, Orange, Free')
                    ->icon('heroicon-o-device-phone-mobile')
                    ->collapsible()
                    ->headerActions([
                        $this->makeTestAction('feexpay'),
                    ])
                    ->schema([
                        Forms\Components\Toggle::make('feexpay_enabled')
                            ->label('Activer FeexPay')
                            ->live(),

                        Forms\Components\Tabs::make('feexpay_tabs')
                            ->tabs([
                                Forms\Components\Tabs\Tab::make('Sandbox')
                                    ->icon('heroicon-o-beaker')
                                    ->schema([
                                        Forms\Components\TextInput::make('feexpay_sandbox_api_key')
                                            ->label('API Key (Sandbox)')
                                            ->password()
                                            ->revealable()
                                            ->placeholder('sk_sandbox_...'),
                                        Forms\Components\TextInput::make('feexpay_sandbox_shop_id')
                                            ->label('Shop ID (Sandbox)')
                                            ->placeholder('shop_...'),
                                    ]),
                                Forms\Components\Tabs\Tab::make('Live')
                                    ->icon('heroicon-o-bolt')
                                    ->schema([
                                        Forms\Components\TextInput::make('feexpay_live_api_key')
                                            ->label('API Key (Live)')
                                            ->password()
                                            ->revealable()
                                            ->placeholder('sk_live_...'),
                                        Forms\Components\TextInput::make('feexpay_live_shop_id')
                                            ->label('Shop ID (Live)')
                                            ->placeholder('shop_...'),
                                    ]),
                            ])
                            ->visible(fn (Forms\Get $get) => $get('feexpay_enabled')),
                    ]),

                // ─── FEDAPAY ─────────────────────────────────────
                Forms\Components\Section::make('FedaPay')
                    ->description('Bénin, Togo, Sénégal, Côte d\'Ivoire — Mobile Money & Cartes')
                    ->icon('heroicon-o-banknotes')
                    ->collapsible()
                    ->headerActions([
                        $this->makeTestAction('fedapay'),
                    ])
                    ->schema([
                        Forms\Components\Toggle::make('fedapay_enabled')
                            ->label('Activer FedaPay')
                            ->live(),

                        Forms\Components\Tabs::make('fedapay_tabs')
                            ->tabs([
                                Forms\Components\Tabs\Tab::make('Sandbox')
                                    ->icon('heroicon-o-beaker')
                                    ->schema([
                                        Forms\Components\TextInput::make('fedapay_sandbox_api_key')
                                            ->label('API Key (Sandbox)')
                                            ->password()
                                            ->revealable(),
                                        Forms\Components\TextInput::make('fedapay_sandbox_webhook_secret')
                                            ->label('Webhook Secret (Sandbox)')
                                            ->password()
                                            ->revealable(),
                                    ]),
                                Forms\Components\Tabs\Tab::make('Live')
                                    ->icon('heroicon-o-bolt')
                                    ->schema([
                                        Forms\Components\TextInput::make('fedapay_live_api_key')
                                            ->label('API Key (Live)')
                                            ->password()
                                            ->revealable(),
                                        Forms\Components\TextInput::make('fedapay_live_webhook_secret')
                                            ->label('Webhook Secret (Live)')
                                            ->password()
                                            ->revealable(),
                                    ]),
                            ])
                            ->visible(fn (Forms\Get $get) => $get('fedapay_enabled')),
                    ]),

                // ─── PAYDUNYA ────────────────────────────────────
                Forms\Components\Section::make('PayDunya')
                    ->description('Sénégal, Bénin, Côte d\'Ivoire, Togo, Burkina — Wave, Orange, MTN, Moov')
                    ->icon('heroicon-o-wallet')
                    ->collapsible()
                    ->headerActions([
                        $this->makeTestAction('paydunya'),
                    ])
                    ->schema([
                        Forms\Components\Toggle::make('paydunya_enabled')
                            ->label('Activer PayDunya')
                            ->live(),

                        Forms\Components\Tabs::make('paydunya_tabs')
                            ->tabs([
                                Forms\Components\Tabs\Tab::make('Sandbox')
                                    ->icon('heroicon-o-beaker')
                                    ->schema([
                                        Forms\Components\TextInput::make('paydunya_sandbox_master_key')
                                            ->label('Master Key')
                                            ->password()
                                            ->revealable(),
                                        Forms\Components\TextInput::make('paydunya_sandbox_public_key')
                                            ->label('Public Key')
                                            ->password()
                                            ->revealable(),
                                        Forms\Components\TextInput::make('paydunya_sandbox_private_key')
                                            ->label('Private Key')
                                            ->password()
                                            ->revealable(),
                                        Forms\Components\TextInput::make('paydunya_sandbox_token')
                                            ->label('Token')
                                            ->password()
                                            ->revealable(),
                                    ]),
                                Forms\Components\Tabs\Tab::make('Live')
                                    ->icon('heroicon-o-bolt')
                                    ->schema([
                                        Forms\Components\TextInput::make('paydunya_live_master_key')
                                            ->label('Master Key')
                                            ->password()
                                            ->revealable(),
                                        Forms\Components\TextInput::make('paydunya_live_public_key')
                                            ->label('Public Key')
                                            ->password()
                                            ->revealable(),
                                        Forms\Components\TextInput::make('paydunya_live_private_key')
                                            ->label('Private Key')
                                            ->password()
                                            ->revealable(),
                                        Forms\Components\TextInput::make('paydunya_live_token')
                                            ->label('Token')
                                            ->password()
                                            ->revealable(),
                                    ]),
                            ])
                            ->visible(fn (Forms\Get $get) => $get('paydunya_enabled')),
                    ]),

                // ─── PAWAPAY ─────────────────────────────────────
                Forms\Components\Section::make('PawaPay')
                    ->description('Couverture panafricaine — MTN, Airtel, Orange, Wave, Moov')
                    ->icon('heroicon-o-globe-alt')
                    ->collapsible()
                    ->headerActions([
                        $this->makeTestAction('pawapay'),
                    ])
                    ->schema([
                        Forms\Components\Toggle::make('pawapay_enabled')
                            ->label('Activer PawaPay')
                            ->live(),

                        Forms\Components\Tabs::make('pawapay_tabs')
                            ->tabs([
                                Forms\Components\Tabs\Tab::make('Sandbox')
                                    ->icon('heroicon-o-beaker')
                                    ->schema([
                                        Forms\Components\TextInput::make('pawapay_sandbox_api_key')
                                            ->label('API Key (Sandbox)')
                                            ->password()
                                            ->revealable(),
                                        Forms\Components\TextInput::make('pawapay_sandbox_signing_key')
                                            ->label('Signing Key (Sandbox)')
                                            ->password()
                                            ->revealable(),
                                    ]),
                                Forms\Components\Tabs\Tab::make('Live')
                                    ->icon('heroicon-o-bolt')
                                    ->schema([
                                        Forms\Components\TextInput::make('pawapay_live_api_key')
                                            ->label('API Key (Live)')
                                            ->password()
                                            ->revealable(),
                                        Forms\Components\TextInput::make('pawapay_live_signing_key')
                                            ->label('Signing Key (Live)')
                                            ->password()
                                            ->revealable(),
                                    ]),
                            ])
                            ->visible(fn (Forms\Get $get) => $get('pawapay_enabled')),
                    ]),

                // ─── CHARIOW ────────────────────────────────────
                Forms\Components\Section::make('Chariow')
                    ->description('Checkout hébergé — Vente de produits digitaux avec paiement intégré. L\'ID produit se configure par produit.')
                    ->icon('heroicon-o-shopping-cart')
                    ->collapsible()
                    ->schema([
                        Forms\Components\Toggle::make('chariow_enabled')
                            ->label('Activer Chariow')
                            ->live(),

                        Forms\Components\Group::make([
                            Forms\Components\TextInput::make('chariow_live_api_key')
                                ->label('Clé API')
                                ->password()
                                ->revealable()
                                ->helperText('Clé API Chariow (Bearer token). Créée dans app.chariow.com > Settings > API Keys.'),
                            Forms\Components\TextInput::make('chariow_live_webhook_secret')
                                ->label('Webhook Secret')
                                ->password()
                                ->revealable()
                                ->helperText('Secret HMAC pour vérifier les webhooks (Pulses). Configurez le webhook vers : ' . config('app.url') . '/api/v1/webhooks/chariow'),
                        ])
                            ->visible(fn (Forms\Get $get) => $get('chariow_enabled')),
                    ]),

                // ─── MAKETOU ────────────────────────────────────
                Forms\Components\Section::make('Maketou')
                    ->description('Checkout hébergé — Paiement via Moneroo (tous réseaux). Utilisé en fallback si les autres providers échouent.')
                    ->icon('heroicon-o-shopping-bag')
                    ->collapsible()
                    ->schema([
                        Forms\Components\Toggle::make('maketou_enabled')
                            ->label('Activer Maketou')
                            ->live(),

                        Forms\Components\TextInput::make('maketou_live_api_key')
                            ->label('Clé API')
                            ->password()
                            ->revealable()
                            ->helperText('Votre clé API Maketou. L\'identifiant produit se configure sur chaque produit (onglet Paiement).')
                            ->visible(fn (Forms\Get $get) => $get('maketou_enabled')),
                    ]),
            ])
            ->statePath('data');
    }

    /**
     * Crée une action "Tester" pour un provider donné.
     * Visible uniquement en mode sandbox et si le provider est activé.
     */
    private function makeTestAction(string $provider): Forms\Components\Actions\Action
    {
        $providerLabels = [
            'feexpay' => 'FeexPay',
            'fedapay' => 'FedaPay',
            'paydunya' => 'PayDunya',
            'pawapay' => 'PawaPay',
        ];

        $countries = [
            'BJ' => 'Bénin',
            'TG' => 'Togo',
            'SN' => 'Sénégal',
            'CI' => 'Côte d\'Ivoire',
            'BF' => 'Burkina Faso',
            'CM' => 'Cameroun',
            'CG' => 'Congo',
        ];

        $networks = [
            'mtn' => 'MTN Mobile Money',
            'moov' => 'Moov Money',
            'celtiis' => 'Celtiis',
            'tmoney' => 'T-Money',
            'wave' => 'Wave',
            'orange' => 'Orange Money',
            'free' => 'Free Money',
            'airtel' => 'Airtel Money',
        ];

        return Forms\Components\Actions\Action::make("test_{$provider}")
            ->label('Tester')
            ->icon('heroicon-o-play')
            ->color('warning')
            ->badge('Sandbox')
            ->badgeColor('warning')
            ->visible(fn (Forms\Get $get) => $get('mode') === 'sandbox' && $get("{$provider}_enabled"))
            ->form([
                Forms\Components\TextInput::make('amount')
                    ->label('Montant (FCFA)')
                    ->numeric()
                    ->default(100)
                    ->required()
                    ->suffix('FCFA'),

                Forms\Components\Select::make('country')
                    ->label('Pays')
                    ->options($countries)
                    ->default('BJ')
                    ->required()
                    ->live(),

                Forms\Components\Select::make('network')
                    ->label('Réseau')
                    ->options(function (Forms\Get $get) use ($networks): array {
                        $country = $get('country');
                        $routing = config('payment.routing', []);
                        $available = array_keys($routing[$country] ?? []);

                        return collect($networks)
                            ->filter(fn ($label, $key) => in_array($key, $available))
                            ->toArray();
                    })
                    ->required(),

                Forms\Components\TextInput::make('phone')
                    ->label('Numéro de téléphone')
                    ->placeholder('97000000')
                    ->required()
                    ->helperText('Numéro de test (sans indicatif pays)'),
            ])
            ->modalHeading('Tester ' . ($providerLabels[$provider] ?? $provider) . ' (Sandbox)')
            ->modalDescription('Envoie une requête de paiement test vers le provider en mode sandbox.')
            ->modalSubmitActionLabel('Lancer le test')
            ->modalIcon('heroicon-o-beaker')
            ->modalIconColor('warning')
            ->action(function (array $data) use ($provider): void {
                $this->runProviderTest($provider, $data);
            });
    }

    /**
     * Exécute un test de paiement sur un provider en sandbox.
     */
    public function runProviderTest(string $provider, array $data): void
    {
        $settings = PaymentSetting::instance();
        $cfg = $settings->providers[$provider]['sandbox'] ?? [];

        // Construire le provider avec les clés sandbox
        $instance = match ($provider) {
            'feexpay' => new FeexPayProvider(
                apiKey: $cfg['api_key'] ?? '',
                shopId: $cfg['shop_id'] ?? '',
                baseUrl: 'https://api.feexpay.me/api',
                callbackUrl: config('app.url') . '/api/v1/webhooks/feexpay',
            ),
            'fedapay' => new FedaPayProvider(
                apiKey: $cfg['api_key'] ?? '',
                baseUrl: 'https://sandbox-api.fedapay.com/v1',
                webhookSecret: $cfg['webhook_secret'] ?? null,
            ),
            'paydunya' => new PayDunyaProvider(
                masterKey: $cfg['master_key'] ?? '',
                publicKey: $cfg['public_key'] ?? '',
                privateKey: $cfg['private_key'] ?? '',
                token: $cfg['token'] ?? '',
                baseUrl: 'https://app.paydunya.com/sandbox-api/v1',
            ),
            'pawapay' => new PawaPayProvider(
                apiKey: $cfg['api_key'] ?? '',
                baseUrl: 'https://api.sandbox.pawapay.cloud',
            ),
            default => null,
        };

        if (! $instance) {
            Notification::make()
                ->title('Provider inconnu')
                ->danger()
                ->send();

            return;
        }

        // Créer un faux order pour le test
        $fakeOrder = new \App\Models\Order();
        $fakeOrder->id = 0;
        $fakeOrder->amount = (int) $data['amount'];
        $fakeOrder->currency = 'XOF';
        $fakeOrder->customer_email = 'test@sellit.app';

        $country = strtoupper($data['country']);
        $network = strtolower($data['network']);
        $phone = $data['phone'];

        try {
            $result = $instance->initiate($fakeOrder, $phone, $country, $network);

            if ($result->success) {
                $details = match ($result->status) {
                    'processing' => 'Le provider a accepté la requête. Le client recevrait un prompt USSD.',
                    'redirect' => 'URL de redirection : ' . ($result->redirectUrl ?? 'N/A'),
                    default => 'Statut : ' . $result->status,
                };

                Notification::make()
                    ->title('Test réussi !')
                    ->body(
                        "**Provider :** {$provider}\n" .
                        "**Ref :** {$result->providerRef}\n" .
                        "**Statut :** {$result->status}\n\n" .
                        $details
                    )
                    ->success()
                    ->duration(15000)
                    ->send();
            } else {
                Notification::make()
                    ->title('Test échoué')
                    ->body(
                        "**Provider :** {$provider}\n" .
                        "**Erreur :** {$result->errorMessage}"
                    )
                    ->danger()
                    ->duration(15000)
                    ->send();
            }
        } catch (\Exception $e) {
            Notification::make()
                ->title('Erreur inattendue')
                ->body($e->getMessage())
                ->danger()
                ->duration(15000)
                ->send();
        }
    }

    public function save(): void
    {
        $data = $this->form->getState();
        $settings = PaymentSetting::instance();

        $settings->update([
            'mode' => $data['mode'],
            'providers' => [
                'feexpay' => [
                    'enabled' => $data['feexpay_enabled'] ?? false,
                    'sandbox' => [
                        'api_key' => $data['feexpay_sandbox_api_key'] ?? '',
                        'shop_id' => $data['feexpay_sandbox_shop_id'] ?? '',
                    ],
                    'live' => [
                        'api_key' => $data['feexpay_live_api_key'] ?? '',
                        'shop_id' => $data['feexpay_live_shop_id'] ?? '',
                    ],
                ],
                'fedapay' => [
                    'enabled' => $data['fedapay_enabled'] ?? false,
                    'sandbox' => [
                        'api_key' => $data['fedapay_sandbox_api_key'] ?? '',
                        'webhook_secret' => $data['fedapay_sandbox_webhook_secret'] ?? '',
                    ],
                    'live' => [
                        'api_key' => $data['fedapay_live_api_key'] ?? '',
                        'webhook_secret' => $data['fedapay_live_webhook_secret'] ?? '',
                    ],
                ],
                'paydunya' => [
                    'enabled' => $data['paydunya_enabled'] ?? false,
                    'sandbox' => [
                        'master_key' => $data['paydunya_sandbox_master_key'] ?? '',
                        'public_key' => $data['paydunya_sandbox_public_key'] ?? '',
                        'private_key' => $data['paydunya_sandbox_private_key'] ?? '',
                        'token' => $data['paydunya_sandbox_token'] ?? '',
                    ],
                    'live' => [
                        'master_key' => $data['paydunya_live_master_key'] ?? '',
                        'public_key' => $data['paydunya_live_public_key'] ?? '',
                        'private_key' => $data['paydunya_live_private_key'] ?? '',
                        'token' => $data['paydunya_live_token'] ?? '',
                    ],
                ],
                'pawapay' => [
                    'enabled' => $data['pawapay_enabled'] ?? false,
                    'sandbox' => [
                        'api_key' => $data['pawapay_sandbox_api_key'] ?? '',
                        'signing_key' => $data['pawapay_sandbox_signing_key'] ?? '',
                    ],
                    'live' => [
                        'api_key' => $data['pawapay_live_api_key'] ?? '',
                        'signing_key' => $data['pawapay_live_signing_key'] ?? '',
                    ],
                ],
                'chariow' => [
                    'enabled' => $data['chariow_enabled'] ?? false,
                    'live' => [
                        'api_key' => $data['chariow_live_api_key'] ?? '',
                        'webhook_secret' => $data['chariow_live_webhook_secret'] ?? '',
                    ],
                ],
                'maketou' => [
                    'enabled' => $data['maketou_enabled'] ?? false,
                    'live' => [
                        'api_key' => $data['maketou_live_api_key'] ?? '',
                    ],
                ],
            ],
        ]);

        Notification::make()
            ->title('Paramètres de paiement sauvegardés')
            ->success()
            ->send();
    }
}
