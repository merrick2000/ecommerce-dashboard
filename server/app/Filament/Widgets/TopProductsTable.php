<?php

namespace App\Filament\Widgets;

use App\Enums\OrderStatus;
use App\Models\Product;
use Carbon\Carbon;
use Filament\Facades\Filament;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\Concerns\InteractsWithPageFilters;
use Filament\Widgets\TableWidget as BaseWidget;

class TopProductsTable extends BaseWidget
{
    use InteractsWithPageFilters;

    protected static ?string $heading = 'Produits les plus vendus';

    protected static ?int $sort = 3;

    protected int | string | array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        $store = Filament::getTenant();

        $startDate = Carbon::parse($this->filters['start_date'] ?? now()->subDays(30));
        $endDate = Carbon::parse($this->filters['end_date'] ?? now())->endOfDay();

        return $table
            ->query(
                Product::query()
                    ->where('store_id', $store->id)
                    ->withCount(['orders' => fn ($q) => $q->where('status', OrderStatus::PAID)
                        ->whereBetween('created_at', [$startDate, $endDate])])
                    ->withSum(['orders' => fn ($q) => $q->where('status', OrderStatus::PAID)
                        ->whereBetween('created_at', [$startDate, $endDate])], 'amount')
                    ->orderByDesc('orders_count')
            )
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Produit')
                    ->limit(40)
                    ->searchable(),

                Tables\Columns\TextColumn::make('display_price')
                    ->label('Prix')
                    ->getStateUsing(function (Product $record) use ($store): string {
                        $resolved = $record->resolveDisplayPrice($store->currency);
                        return $resolved['formatted_price'];
                    })
                    ->sortable(query: fn ($query, $direction) => $query->orderBy('price', $direction)),

                Tables\Columns\TextColumn::make('orders_count')
                    ->label('Ventes')
                    ->sortable()
                    ->badge()
                    ->color('success'),

                Tables\Columns\TextColumn::make('orders_sum_amount')
                    ->label('Revenus')
                    ->formatStateUsing(function ($state, Product $record) use ($store): string {
                        // Utiliser la devise de la dernière commande payée ou la devise du store
                        $currency = $record->orders()
                            ->where('status', OrderStatus::PAID)
                            ->latest()
                            ->value('currency') ?? $store->currency;
                        return number_format($state ?? 0, 0, ',', ' ') . ' ' . $currency;
                    })
                    ->sortable(),
            ])
            ->defaultPaginationPageOption(5);
    }
}
