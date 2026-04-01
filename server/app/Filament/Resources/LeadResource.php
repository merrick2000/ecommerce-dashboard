<?php

namespace App\Filament\Resources;

use App\Filament\Resources\LeadResource\Pages;
use App\Models\Lead;
use App\Models\Order;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class LeadResource extends Resource
{
    protected static ?string $model = Lead::class;

    protected static ?string $navigationIcon = 'heroicon-o-user-group';

    protected static ?string $navigationLabel = 'Leads';

    protected static ?int $navigationSort = 5;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('customer_email')
                    ->label('Email')
                    ->disabled(),
                Forms\Components\TextInput::make('customer_name')
                    ->label('Nom')
                    ->disabled(),
                Forms\Components\TextInput::make('customer_phone')
                    ->label('Téléphone')
                    ->disabled(),
                Forms\Components\Select::make('product_id')
                    ->label('Produit')
                    ->relationship('product', 'name')
                    ->disabled(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('customer_email')
                    ->label('Email')
                    ->searchable()
                    ->copyable(),

                Tables\Columns\TextColumn::make('customer_name')
                    ->label('Nom')
                    ->searchable()
                    ->default('—'),

                Tables\Columns\TextColumn::make('customer_phone')
                    ->label('Téléphone')
                    ->default('—')
                    ->copyable(),

                Tables\Columns\TextColumn::make('product.name')
                    ->label('Produit')
                    ->limit(25),

                Tables\Columns\TextColumn::make('source')
                    ->label('Source')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'checkout' => 'info',
                        'external_link' => 'warning',
                        default => 'gray',
                    }),

                Tables\Columns\TextColumn::make('reminder_count')
                    ->label('Relances')
                    ->badge()
                    ->color(fn (int $state): string => match (true) {
                        $state === 0 => 'gray',
                        $state === 1 => 'info',
                        $state === 2 => 'warning',
                        default => 'danger',
                    })
                    ->formatStateUsing(fn (int $state): string => $state . '/3'),

                Tables\Columns\IconColumn::make('converted')
                    ->label('Converti')
                    ->getStateUsing(fn (Lead $record): bool => $record->converted_at !== null)
                    ->boolean()
                    ->trueIcon('heroicon-o-check-circle')
                    ->falseIcon('heroicon-o-x-circle')
                    ->trueColor('success')
                    ->falseColor('danger'),

                Tables\Columns\TextColumn::make('last_reminded_at')
                    ->label('Derniere relance')
                    ->dateTime('d/m H:i')
                    ->sortable()
                    ->default('—'),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Date')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('source')
                    ->options([
                        'checkout' => 'Checkout',
                        'external_link' => 'Lien externe',
                    ]),
                Tables\Filters\TernaryFilter::make('converted')
                    ->label('Converti')
                    ->queries(
                        true: fn ($query) => $query->whereNotNull('converted_at'),
                        false: fn ($query) => $query->whereNull('converted_at'),
                    ),
                Tables\Filters\TernaryFilter::make('reminded')
                    ->label('Relance')
                    ->queries(
                        true: fn ($query) => $query->where('reminder_count', '>', 0),
                        false: fn ($query) => $query->where('reminder_count', 0),
                    ),
                Tables\Filters\Filter::make('created_at')
                    ->form([
                        Forms\Components\DatePicker::make('from')->label('Du')->native(false),
                        Forms\Components\DatePicker::make('until')->label('Au')->native(false),
                    ])
                    ->query(function ($query, array $data) {
                        return $query
                            ->when($data['from'], fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
                            ->when($data['until'], fn ($q, $d) => $q->whereDate('created_at', '<=', $d));
                    }),
            ])
            ->actions([
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\DeleteBulkAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ManageLeads::route('/'),
        ];
    }
}
