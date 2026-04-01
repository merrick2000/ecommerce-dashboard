<?php

namespace App\Filament\Resources;

use App\Enums\OrderStatus;
use App\Filament\Resources\OrderResource\Pages;
use App\Models\Order;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\HtmlString;

class OrderResource extends Resource
{
    protected static ?string $model = Order::class;

    protected static ?string $navigationIcon = 'heroicon-o-shopping-bag';

    protected static ?string $navigationLabel = 'Commandes';

    protected static ?int $navigationSort = 4;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Détails commande')
                    ->schema([
                        Forms\Components\TextInput::make('order_number')
                            ->label('N° commande')
                            ->disabled(),

                        Forms\Components\Select::make('product_id')
                            ->label('Produit')
                            ->relationship('product', 'name')
                            ->disabled(),

                        Forms\Components\TextInput::make('customer_email')
                            ->label('Email client')
                            ->disabled(),

                        Forms\Components\TextInput::make('customer_name')
                            ->label('Nom client')
                            ->disabled(),

                        Forms\Components\TextInput::make('customer_phone')
                            ->label('Téléphone')
                            ->disabled(),

                        Forms\Components\TextInput::make('amount')
                            ->label('Montant')
                            ->suffix(fn (?Order $record) => $record?->currency ?? 'XOF')
                            ->disabled(),

                        Forms\Components\Select::make('status')
                            ->label('Statut')
                            ->options(collect(OrderStatus::cases())->mapWithKeys(
                                fn (OrderStatus $status) => [$status->value => $status->label()]
                            ))
                            ->required(),

                        Forms\Components\TextInput::make('payment_method')
                            ->label('Méthode de paiement')
                            ->disabled(),

                        Forms\Components\TextInput::make('source')
                            ->label('Source')
                            ->disabled(),

                        Forms\Components\Placeholder::make('payment_ref_link')
                            ->label('Référence paiement')
                            ->content(function (Order $record): HtmlString {
                                $ref = $record->payment_ref;
                                if (! $ref) {
                                    return new HtmlString('<span class="text-gray-400">—</span>');
                                }
                                if (str_starts_with($ref, 'http')) {
                                    return new HtmlString(
                                        '<a href="' . e($ref) . '" target="_blank" class="text-primary-600 hover:underline">'
                                        . e($ref) . ' ↗</a>'
                                    );
                                }
                                return new HtmlString(e($ref));
                            }),
                    ])->columns(2),

                Forms\Components\Section::make('Attribution')
                    ->schema([
                        Forms\Components\TextInput::make('utm_source')
                            ->label('UTM Source')
                            ->disabled(),
                        Forms\Components\TextInput::make('utm_medium')
                            ->label('UTM Medium')
                            ->disabled(),
                        Forms\Components\TextInput::make('utm_campaign')
                            ->label('UTM Campaign')
                            ->disabled(),
                        Forms\Components\TextInput::make('referrer')
                            ->label('Referrer')
                            ->disabled(),
                        Forms\Components\TextInput::make('promo_code')
                            ->label('Code promo')
                            ->disabled(),
                    ])
                    ->columns(2)
                    ->collapsed()
                    ->visible(fn (?Order $record): bool =>
                        $record?->utm_source || $record?->utm_medium || $record?->utm_campaign || $record?->referrer || $record?->promo_code
                    ),

                Forms\Components\Section::make('Details paiement')
                    ->schema([
                        Forms\Components\Placeholder::make('payment_details')
                            ->label('')
                            ->content(function (Order $record): HtmlString {
                                $tx = $record->paymentTransactions()->latest()->first();
                                if (! $tx) {
                                    return new HtmlString('<span class="text-gray-400">Aucune transaction</span>');
                                }
                                $details = [
                                    'Provider' => $tx->provider,
                                    'Ref' => $tx->provider_ref,
                                    'Statut' => $tx->status,
                                    'Pays' => $tx->country,
                                    'Reseau' => $tx->network,
                                    'Telephone' => $tx->phone,
                                    'Tentative' => $tx->attempt_number,
                                ];
                                $html = '<div class="space-y-1 text-sm">';
                                foreach ($details as $label => $val) {
                                    if ($val) {
                                        $html .= '<div><span class="text-gray-500">' . e($label) . ':</span> <strong>' . e($val) . '</strong></div>';
                                    }
                                }
                                if ($tx->provider_response) {
                                    $html .= '<details class="mt-2"><summary class="text-gray-400 cursor-pointer text-xs">Response brute</summary><pre class="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">' . e(json_encode($tx->provider_response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . '</pre></details>';
                                }
                                $html .= '</div>';
                                return new HtmlString($html);
                            }),
                    ])
                    ->collapsed()
                    ->visible(fn (?Order $record): bool => $record?->paymentTransactions()->exists() ?? false),

                Forms\Components\Section::make('Metadata')
                    ->schema([
                        Forms\Components\KeyValue::make('metadata')
                            ->label('')
                            ->disabled(),
                    ])
                    ->collapsed()
                    ->visible(fn (?Order $record): bool => ! empty($record?->metadata)),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('order_number')
                    ->label('N°')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('customer_email')
                    ->label('Client')
                    ->searchable(),

                Tables\Columns\TextColumn::make('product.name')
                    ->label('Produit')
                    ->limit(30),

                Tables\Columns\TextColumn::make('amount')
                    ->label('Montant')
                    ->formatStateUsing(fn (int $state, Order $record): string =>
                        number_format($state, 0, ',', ' ') . ' ' . $record->currency
                    )
                    ->sortable(),

                Tables\Columns\TextColumn::make('source')
                    ->label('Source')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'native' => 'info',
                        'selar' => 'warning',
                        'chariow' => 'success',
                        default => 'gray',
                    }),

                Tables\Columns\TextColumn::make('status')
                    ->label('Statut')
                    ->badge()
                    ->formatStateUsing(fn (OrderStatus $state): string => $state->label())
                    ->color(fn (OrderStatus $state): string => match ($state) {
                        OrderStatus::PENDING => 'warning',
                        OrderStatus::PAID => 'success',
                        OrderStatus::FAILED => 'danger',
                        OrderStatus::REFUNDED => 'gray',
                    }),

                Tables\Columns\TextColumn::make('payment_method')
                    ->label('Paiement')
                    ->badge()
                    ->color('gray'),

                Tables\Columns\TextColumn::make('utm_source')
                    ->label('Origine')
                    ->badge()
                    ->color(fn (?string $state): string => match (true) {
                        $state === null => 'gray',
                        str_contains($state ?? '', 'facebook') || str_contains($state ?? '', 'fb') => 'info',
                        str_contains($state ?? '', 'google') => 'success',
                        str_contains($state ?? '', 'tiktok') => 'warning',
                        default => 'primary',
                    })
                    ->default('direct')
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('promo_code')
                    ->label('Promo')
                    ->badge()
                    ->color('success')
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Date')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options(collect(OrderStatus::cases())->mapWithKeys(
                        fn (OrderStatus $status) => [$status->value => $status->label()]
                    )),
                Tables\Filters\SelectFilter::make('source')
                    ->options([
                        'native' => 'Native',
                        'selar' => 'Selar',
                        'chariow' => 'Chariow',
                    ]),
                Tables\Filters\Filter::make('created_at')
                    ->form([
                        Forms\Components\DatePicker::make('from')
                            ->label('Du')
                            ->native(false),
                        Forms\Components\DatePicker::make('until')
                            ->label('Au')
                            ->native(false),
                    ])
                    ->query(function (\Illuminate\Database\Eloquent\Builder $query, array $data): \Illuminate\Database\Eloquent\Builder {
                        return $query
                            ->when($data['from'], fn ($q, $date) => $q->whereDate('created_at', '>=', $date))
                            ->when($data['until'], fn ($q, $date) => $q->whereDate('created_at', '<=', $date));
                    })
                    ->indicateUsing(function (array $data): array {
                        $indicators = [];
                        if ($data['from'] ?? null) {
                            $indicators['from'] = 'Du ' . \Carbon\Carbon::parse($data['from'])->format('d/m/Y');
                        }
                        if ($data['until'] ?? null) {
                            $indicators['until'] = 'Au ' . \Carbon\Carbon::parse($data['until'])->format('d/m/Y');
                        }
                        return $indicators;
                    }),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListOrders::route('/'),
            'edit' => Pages\EditOrder::route('/{record}/edit'),
        ];
    }
}
