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
                            ->suffix('FCFA')
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
