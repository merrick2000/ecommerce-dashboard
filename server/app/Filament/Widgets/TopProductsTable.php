<?php

namespace App\Filament\Widgets;

use App\Enums\OrderStatus;
use App\Models\Product;
use App\Models\Store;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class TopProductsTable extends BaseWidget
{
    protected static ?string $heading = 'Produits les plus vendus';

    protected static ?int $sort = 3;

    protected int | string | array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        $user = auth()->user();
        $storeIds = Store::where('user_id', $user->id)->pluck('id');

        return $table
            ->query(
                Product::query()
                    ->whereIn('store_id', $storeIds)
                    ->withCount(['orders' => fn ($q) => $q->where('status', OrderStatus::PAID)])
                    ->withSum(['orders' => fn ($q) => $q->where('status', OrderStatus::PAID)], 'amount')
                    ->orderByDesc('orders_count')
            )
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Produit')
                    ->limit(40)
                    ->searchable(),

                Tables\Columns\TextColumn::make('store.name')
                    ->label('Boutique')
                    ->badge()
                    ->color('info'),

                Tables\Columns\TextColumn::make('price')
                    ->label('Prix')
                    ->formatStateUsing(fn ($state) => number_format($state) . ' FCFA')
                    ->sortable(),

                Tables\Columns\TextColumn::make('orders_count')
                    ->label('Ventes')
                    ->sortable()
                    ->badge()
                    ->color('success'),

                Tables\Columns\TextColumn::make('orders_sum_amount')
                    ->label('Revenus')
                    ->formatStateUsing(fn ($state) => number_format($state ?? 0) . ' FCFA')
                    ->sortable(),
            ])
            ->defaultPaginationPageOption(5);
    }
}
