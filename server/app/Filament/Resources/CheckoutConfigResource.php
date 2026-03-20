<?php

namespace App\Filament\Resources;

use App\Enums\TemplateType;
use App\Filament\Resources\CheckoutConfigResource\Pages;
use App\Models\CheckoutConfig;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Forms\Set;
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

                Forms\Components\Tabs::make('Configuration')
                    ->tabs([
                        // ─── TAB 1 : STYLE ──────────────────────────────
                        Forms\Components\Tabs\Tab::make('Style & CTA')
                            ->icon('heroicon-o-paint-brush')
                            ->schema([
                                Forms\Components\Grid::make(2)
                                    ->schema([
                                        Forms\Components\Radio::make('template_type')
                                            ->label('Template')
                                            ->options([
                                                TemplateType::CLASSIC->value => 'Classic — Épuré, fond blanc',
                                                TemplateType::DARK_PREMIUM->value => 'Dark Premium — Effet luxe',
                                                TemplateType::MINIMALIST_CARD->value => 'Minimalist — Ultra-simple',
                                            ])
                                            ->default(TemplateType::CLASSIC->value)
                                            ->required()
                                            ->columns(1),

                                        Forms\Components\Group::make([
                                            Forms\Components\ColorPicker::make('primary_color')
                                                ->label('Couleur principale')
                                                ->default('#E67E22')
                                                ->required(),

                                            Forms\Components\TextInput::make('cta_text')
                                                ->label('Texte du bouton CTA')
                                                ->default('Acheter maintenant')
                                                ->required()
                                                ->maxLength(100)
                                                ->placeholder('Ex: Débloquer mon accès'),

                                            Forms\Components\TagsInput::make('trust_badges')
                                                ->label('Badges de confiance')
                                                ->placeholder('Ajouter un badge...')
                                                ->helperText('Ex: Paiement sécurisé, Accès immédiat')
                                                ->default([]),
                                        ]),
                                    ]),
                            ]),

                        // ─── TAB 2 : URGENCE & CONVERSION ───────────────
                        Forms\Components\Tabs\Tab::make('Urgence & Conversion')
                            ->icon('heroicon-o-fire')
                            ->schema([
                                Forms\Components\Grid::make(2)
                                    ->schema([
                                        // Compte à rebours
                                        Forms\Components\Fieldset::make('Compte à rebours')
                                            ->schema([
                                                Forms\Components\Toggle::make('urgency_config.countdown_timer.enabled')
                                                    ->label('Activer')
                                                    ->default(false)
                                                    ->live(onBlur: true),
                                                Forms\Components\Select::make('urgency_config.countdown_timer.duration_minutes')
                                                    ->label('Durée')
                                                    ->options([5 => '5 min', 10 => '10 min', 15 => '15 min', 30 => '30 min', 60 => '1h'])
                                                    ->default(15)
                                                    ->visible(fn (Forms\Get $get) => $get('urgency_config.countdown_timer.enabled')),
                                                Forms\Components\TextInput::make('urgency_config.countdown_timer.label')
                                                    ->label('Texte')
                                                    ->default('Offre expire dans')
                                                    ->visible(fn (Forms\Get $get) => $get('urgency_config.countdown_timer.enabled')),
                                            ]),

                                        // Places limitées
                                        Forms\Components\Fieldset::make('Places limitées')
                                            ->schema([
                                                Forms\Components\Toggle::make('urgency_config.limited_spots.enabled')
                                                    ->label('Activer')
                                                    ->default(false)
                                                    ->live(onBlur: true),
                                                Forms\Components\TextInput::make('urgency_config.limited_spots.total_spots')
                                                    ->label('Total places')
                                                    ->numeric()
                                                    ->minValue(1)
                                                    ->default(50)
                                                    ->visible(fn (Forms\Get $get) => $get('urgency_config.limited_spots.enabled')),
                                                Forms\Components\TextInput::make('urgency_config.limited_spots.remaining_spots')
                                                    ->label('Restantes affichées')
                                                    ->numeric()
                                                    ->minValue(1)
                                                    ->default(12)
                                                    ->visible(fn (Forms\Get $get) => $get('urgency_config.limited_spots.enabled')),
                                            ]),

                                        // Offre flash
                                        Forms\Components\Fieldset::make('Offre flash')
                                            ->schema([
                                                Forms\Components\Toggle::make('urgency_config.flash_sale.enabled')
                                                    ->label('Activer')
                                                    ->default(false)
                                                    ->live(onBlur: true),
                                                Forms\Components\TextInput::make('urgency_config.flash_sale.discount_percent')
                                                    ->label('Réduction')
                                                    ->numeric()
                                                    ->minValue(1)
                                                    ->maxValue(99)
                                                    ->suffix('%')
                                                    ->default(30)
                                                    ->visible(fn (Forms\Get $get) => $get('urgency_config.flash_sale.enabled')),
                                                Forms\Components\Select::make('urgency_config.flash_sale.duration_minutes')
                                                    ->label('Durée')
                                                    ->options([5 => '5 min', 10 => '10 min', 15 => '15 min', 30 => '30 min', 60 => '1h'])
                                                    ->default(30)
                                                    ->visible(fn (Forms\Get $get) => $get('urgency_config.flash_sale.enabled')),
                                            ]),

                                        // Social proof
                                        Forms\Components\Fieldset::make('Preuve sociale')
                                            ->schema([
                                                Forms\Components\Toggle::make('urgency_config.social_proof.enabled')
                                                    ->label('Afficher "X personnes regardent"')
                                                    ->default(false)
                                                    ->live(onBlur: true),
                                                Forms\Components\TextInput::make('urgency_config.social_proof.viewer_count')
                                                    ->label('Nombre affiché')
                                                    ->numeric()
                                                    ->minValue(1)
                                                    ->default(24)
                                                    ->visible(fn (Forms\Get $get) => $get('urgency_config.social_proof.enabled')),
                                            ]),
                                    ]),
                            ]),

                        // ─── TAB 3 : PAIEMENT ───────────────────────────
                        Forms\Components\Tabs\Tab::make('Paiement')
                            ->icon('heroicon-o-credit-card')
                            ->schema([
                                Forms\Components\CheckboxList::make('payment_logos')
                                    ->label('Moyens de paiement affichés')
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

                        // ─── TAB 4 : SALES POPUP ────────────────────────
                        Forms\Components\Tabs\Tab::make('Sales Popup')
                            ->icon('heroicon-o-bell-alert')
                            ->schema([
                                Forms\Components\Toggle::make('sales_popup.enabled')
                                    ->label('Activer les notifications de vente')
                                    ->default(false)
                                    ->live(onBlur: true),

                                Forms\Components\Grid::make(2)
                                    ->schema([
                                        Forms\Components\TextInput::make('sales_popup.interval_seconds')
                                            ->label('Intervalle entre notifications')
                                            ->numeric()
                                            ->minValue(5)
                                            ->maxValue(120)
                                            ->default(8)
                                            ->suffix('sec'),

                                        Forms\Components\Toggle::make('sales_popup.show_name')
                                            ->label('Afficher le prénom')
                                            ->helperText('Si désactivé : "Quelqu\'un de Dakar vient d\'acheter..."')
                                            ->default(true),
                                    ])
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

                        // ─── TAB 5 : PAGE LAYOUT ───────────────────────
                        Forms\Components\Tabs\Tab::make('Ordre des sections')
                            ->icon('heroicon-o-queue-list')
                            ->schema([
                                Forms\Components\Placeholder::make('layout_help')
                                    ->content('Glissez-déposez les sections pour réorganiser la page de vente. Désactivez les sections que vous ne souhaitez pas afficher.')
                                    ->columnSpanFull(),

                                Forms\Components\Repeater::make('page_layout')
                                    ->label('')
                                    ->schema([
                                        Forms\Components\Grid::make(3)
                                            ->schema([
                                                Forms\Components\Toggle::make('visible')
                                                    ->label('Afficher')
                                                    ->default(true)
                                                    ->inline(false),

                                                Forms\Components\TextInput::make('label')
                                                    ->label('Section')
                                                    ->disabled()
                                                    ->dehydrated(),

                                                Forms\Components\Hidden::make('key'),
                                            ]),
                                    ])
                                    ->default(CheckoutConfig::DEFAULT_PAGE_LAYOUT)
                                    ->reorderable()
                                    ->reorderableWithDragAndDrop()
                                    ->addable(false)
                                    ->deletable(false)
                                    ->collapsible(false)
                                    ->itemLabel(fn (array $state): ?string => $state['label'] ?? null),
                            ]),

                        // ─── TAB 6 : TRACKING ───────────────────────────
                        Forms\Components\Tabs\Tab::make('Tracking')
                            ->icon('heroicon-o-chart-bar')
                            ->schema([
                                Forms\Components\Grid::make(2)
                                    ->schema([
                                        Forms\Components\Fieldset::make('Facebook Pixel')
                                            ->schema([
                                                Forms\Components\TextInput::make('tracking_config.facebook_pixel_id')
                                                    ->label('Pixel ID')
                                                    ->placeholder('123456789012345')
                                                    ->maxLength(50),

                                                Forms\Components\TextInput::make('tracking_config.facebook_access_token')
                                                    ->label('Token Conversion API')
                                                    ->password()
                                                    ->revealable()
                                                    ->maxLength(500),

                                                Forms\Components\TextInput::make('tracking_config.facebook_test_event_code')
                                                    ->label('Code test (optionnel)')
                                                    ->placeholder('TEST12345')
                                                    ->maxLength(50),
                                            ]),

                                        Forms\Components\Fieldset::make('TikTok Pixel')
                                            ->schema([
                                                Forms\Components\TextInput::make('tracking_config.tiktok_pixel_id')
                                                    ->label('Pixel ID')
                                                    ->placeholder('ABCDEFGH12345678')
                                                    ->maxLength(50),
                                            ]),
                                    ]),
                            ]),
                    ])
                    ->columnSpanFull()
                    ->persistTabInQueryString(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('store.name')
                    ->label('Boutique')
                    ->toggleable(isToggledHiddenByDefault: true)
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
