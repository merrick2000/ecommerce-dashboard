<?php

namespace App\Filament\Resources;

use App\Enums\TemplateType;
use App\Filament\Resources\CheckoutConfigResource\Pages;
use App\Models\CheckoutConfig;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class CheckoutConfigResource extends Resource
{
    protected static ?string $model = CheckoutConfig::class;

    protected static ?string $navigationIcon = 'heroicon-o-paint-brush';

    protected static ?string $navigationLabel = 'Checkout Config';

    protected static ?string $navigationGroup = 'Configuration';

    protected static ?int $navigationSort = 3;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Boutique')
                    ->schema([
                        Forms\Components\Select::make('store_id')
                            ->label('Boutique')
                            ->relationship('store', 'name')
                            ->required()
                            ->searchable()
                            ->preload()
                            ->unique(ignoreRecord: true)
                            ->helperText('Chaque boutique ne peut avoir qu\'une seule configuration.'),
                    ]),

                Forms\Components\Section::make('Style du tunnel de vente')
                    ->description('Template et couleurs de votre page checkout.')
                    ->schema([
                        Forms\Components\Radio::make('template_type')
                            ->label('Template')
                            ->options([
                                TemplateType::CLASSIC->value => 'Classic — Layout épuré, fond blanc, conversion maximale',
                                TemplateType::DARK_PREMIUM->value => 'Dark Premium — Fond sombre, effet luxe, formations haut de gamme',
                                TemplateType::MINIMALIST_CARD->value => 'Minimalist Card — Carte centrée, ultra-simple, parfait mobile',
                            ])
                            ->default(TemplateType::CLASSIC->value)
                            ->required()
                            ->columns(1),

                        Forms\Components\ColorPicker::make('primary_color')
                            ->label('Couleur principale')
                            ->default('#E67E22')
                            ->required(),
                    ]),

                Forms\Components\Section::make('Contenu & CTA')
                    ->schema([
                        Forms\Components\TextInput::make('cta_text')
                            ->label('Texte du bouton CTA')
                            ->default('Acheter maintenant')
                            ->required()
                            ->maxLength(100)
                            ->placeholder('Ex: Débloquer mon accès'),

                        Forms\Components\TagsInput::make('trust_badges')
                            ->label('Badges de confiance')
                            ->placeholder('Ajouter un badge...')
                            ->helperText('Ex: Paiement sécurisé, Accès immédiat, Satisfait ou remboursé')
                            ->default([]),
                    ]),

                // ─── TIMERS D'URGENCE & MARKETING ────────────────────
                Forms\Components\Section::make('Timers d\'urgence & Social Proof')
                    ->description('Widgets de conversion ultra-orientés marketing. Activez ceux que vous voulez.')
                    ->collapsible()
                    ->schema([

                        // Compte à rebours
                        Forms\Components\Fieldset::make('Compte à rebours')
                            ->schema([
                                Forms\Components\Toggle::make('urgency_config.countdown_timer.enabled')
                                    ->label('Activer le compte à rebours')
                                    ->default(false)
                                    ->live(),
                                Forms\Components\Select::make('urgency_config.countdown_timer.duration_minutes')
                                    ->label('Durée')
                                    ->options([
                                        5 => '5 minutes',
                                        10 => '10 minutes',
                                        15 => '15 minutes',
                                        30 => '30 minutes',
                                        60 => '1 heure',
                                    ])
                                    ->default(15)
                                    ->visible(fn (Forms\Get $get) => $get('urgency_config.countdown_timer.enabled')),
                                Forms\Components\TextInput::make('urgency_config.countdown_timer.label')
                                    ->label('Texte personnalisé')
                                    ->placeholder('Offre expire dans')
                                    ->default('Offre expire dans')
                                    ->visible(fn (Forms\Get $get) => $get('urgency_config.countdown_timer.enabled')),
                            ]),

                        // Places limitées
                        Forms\Components\Fieldset::make('Places limitées')
                            ->schema([
                                Forms\Components\Toggle::make('urgency_config.limited_spots.enabled')
                                    ->label('Afficher "Plus que X places"')
                                    ->default(false)
                                    ->live(),
                                Forms\Components\TextInput::make('urgency_config.limited_spots.total_spots')
                                    ->label('Total de places')
                                    ->numeric()
                                    ->minValue(1)
                                    ->default(50)
                                    ->visible(fn (Forms\Get $get) => $get('urgency_config.limited_spots.enabled')),
                                Forms\Components\TextInput::make('urgency_config.limited_spots.remaining_spots')
                                    ->label('Places restantes affichées')
                                    ->numeric()
                                    ->minValue(1)
                                    ->default(12)
                                    ->visible(fn (Forms\Get $get) => $get('urgency_config.limited_spots.enabled')),
                            ]),

                        // Offre flash
                        Forms\Components\Fieldset::make('Offre flash')
                            ->schema([
                                Forms\Components\Toggle::make('urgency_config.flash_sale.enabled')
                                    ->label('Bannière offre flash')
                                    ->default(false)
                                    ->live(),
                                Forms\Components\TextInput::make('urgency_config.flash_sale.discount_percent')
                                    ->label('Réduction affichée')
                                    ->numeric()
                                    ->minValue(1)
                                    ->maxValue(99)
                                    ->suffix('%')
                                    ->default(30)
                                    ->visible(fn (Forms\Get $get) => $get('urgency_config.flash_sale.enabled')),
                                Forms\Components\Select::make('urgency_config.flash_sale.duration_minutes')
                                    ->label('Durée du timer flash')
                                    ->options([
                                        5 => '5 min',
                                        10 => '10 min',
                                        15 => '15 min',
                                        30 => '30 min',
                                        60 => '1 heure',
                                    ])
                                    ->default(30)
                                    ->visible(fn (Forms\Get $get) => $get('urgency_config.flash_sale.enabled')),
                            ]),

                        // Preuve sociale
                        Forms\Components\Fieldset::make('Preuve sociale')
                            ->schema([
                                Forms\Components\Toggle::make('urgency_config.social_proof.enabled')
                                    ->label('Afficher "X personnes regardent"')
                                    ->default(false)
                                    ->live(),
                                Forms\Components\TextInput::make('urgency_config.social_proof.viewer_count')
                                    ->label('Nombre de viewers affiché')
                                    ->numeric()
                                    ->minValue(1)
                                    ->default(24)
                                    ->helperText('Un léger aléa sera ajouté côté client pour un effet réaliste.')
                                    ->visible(fn (Forms\Get $get) => $get('urgency_config.social_proof.enabled')),
                            ]),
                    ]),

                Forms\Components\Section::make('Logos de paiement')
                    ->description('Sélectionnez les moyens de paiement à afficher sur la page checkout.')
                    ->schema([
                        Forms\Components\CheckboxList::make('payment_logos')
                            ->label('')
                            ->options([
                                'wave' => 'Wave',
                                'orange_money' => 'Orange Money',
                                'mtn_momo' => 'MTN Mobile Money',
                                'moov_money' => 'Moov Money',
                                'free_money' => 'Free Money',
                                'celtiis' => 'Celtiis Cash',
                                'visa' => 'Visa',
                                'mastercard' => 'Mastercard',
                                'paypal' => 'PayPal',
                                'stripe' => 'Stripe',
                                'fedapay' => 'FedaPay',
                                'paydunya' => 'PayDunya',
                            ])
                            ->columns(3)
                            ->default([]),
                    ]),

                // ─── SALES POPUP ────────────────────────────────────────
                Forms\Components\Section::make('Sales Popup (Preuve sociale)')
                    ->description('Notifications "X de Y vient d\'acheter" qui apparaissent en bas de page.')
                    ->collapsible()
                    ->schema([
                        Forms\Components\Toggle::make('sales_popup.enabled')
                            ->label('Activer les notifications de vente')
                            ->default(false)
                            ->live(),

                        Forms\Components\TextInput::make('sales_popup.interval_seconds')
                            ->label('Intervalle entre chaque notification (secondes)')
                            ->numeric()
                            ->minValue(5)
                            ->maxValue(120)
                            ->default(8)
                            ->suffix('sec')
                            ->visible(fn (Forms\Get $get) => $get('sales_popup.enabled')),

                        Forms\Components\Repeater::make('sales_popup.entries')
                            ->label('Acheteurs simulés')
                            ->schema([
                                Forms\Components\TextInput::make('name')
                                    ->label('Prénom')
                                    ->required()
                                    ->placeholder('Mohamed'),
                                Forms\Components\TextInput::make('city')
                                    ->label('Ville')
                                    ->required()
                                    ->placeholder('Dakar'),
                            ])
                            ->columns(2)
                            ->addActionLabel('Ajouter un acheteur')
                            ->reorderable()
                            ->defaultItems(0)
                            ->visible(fn (Forms\Get $get) => $get('sales_popup.enabled')),
                    ]),

                // ─── TRACKING PIXELS ──────────────────────────────────────
                Forms\Components\Section::make('Tracking & Pixels')
                    ->description('Configurez vos pixels de tracking pour mesurer les conversions.')
                    ->collapsible()
                    ->schema([
                        Forms\Components\Fieldset::make('Facebook Pixel')
                            ->schema([
                                Forms\Components\TextInput::make('tracking_config.facebook_pixel_id')
                                    ->label('Pixel ID')
                                    ->placeholder('123456789012345')
                                    ->maxLength(50)
                                    ->helperText('Votre ID de pixel Facebook (15 chiffres).'),

                                Forms\Components\TextInput::make('tracking_config.facebook_access_token')
                                    ->label('Token Conversion API')
                                    ->password()
                                    ->revealable()
                                    ->maxLength(500)
                                    ->helperText('Token d\'accès pour l\'API de conversions côté serveur. Ne sera jamais exposé au frontend.'),

                                Forms\Components\TextInput::make('tracking_config.facebook_test_event_code')
                                    ->label('Code événement test (optionnel)')
                                    ->placeholder('TEST12345')
                                    ->maxLength(50)
                                    ->helperText('Utilisez un code test pour valider vos événements dans le gestionnaire d\'événements Facebook.'),
                            ]),

                        Forms\Components\Fieldset::make('TikTok Pixel')
                            ->schema([
                                Forms\Components\TextInput::make('tracking_config.tiktok_pixel_id')
                                    ->label('Pixel ID')
                                    ->placeholder('ABCDEFGH12345678')
                                    ->maxLength(50)
                                    ->helperText('Votre ID de pixel TikTok.'),
                            ]),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('store.name')
                    ->label('Boutique')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('template_type')
                    ->label('Template')
                    ->badge()
                    ->formatStateUsing(fn (TemplateType $state): string => $state->label())
                    ->color(fn (TemplateType $state): string => match ($state) {
                        TemplateType::CLASSIC => 'info',
                        TemplateType::DARK_PREMIUM => 'warning',
                        TemplateType::MINIMALIST_CARD => 'success',
                    }),

                Tables\Columns\ColorColumn::make('primary_color')
                    ->label('Couleur'),

                Tables\Columns\TextColumn::make('cta_text')
                    ->label('CTA')
                    ->limit(30),

                Tables\Columns\TextColumn::make('urgency_config')
                    ->label('Urgence')
                    ->formatStateUsing(function (?array $state): string {
                        if (! $state) return 'Aucun';
                        $count = collect($state)->filter(fn ($v) => is_array($v) && ($v['enabled'] ?? false))->count();
                        return $count > 0 ? $count . ' actif(s)' : 'Aucun';
                    })
                    ->badge()
                    ->color(fn (?array $state): string =>
                        $state && collect($state)->filter(fn ($v) => is_array($v) && ($v['enabled'] ?? false))->count() > 0
                            ? 'success' : 'gray'
                    ),

                Tables\Columns\TextColumn::make('updated_at')
                    ->label('Modifié le')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->filters([])
            ->actions([
                Tables\Actions\Action::make('preview')
                    ->label('Preview')
                    ->icon('heroicon-o-eye')
                    ->color('success')
                    ->url(fn (CheckoutConfig $record): string =>
                        (env('FRONTEND_URL', 'http://localhost:3000')) . '/' . $record->store->slug
                    )
                    ->openUrlInNewTab(),
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListCheckoutConfigs::route('/'),
            'create' => Pages\CreateCheckoutConfig::route('/create'),
            'edit' => Pages\EditCheckoutConfig::route('/{record}/edit'),
        ];
    }
}
