<?php

namespace App\Filament\Widgets;

use App\Models\Product;
use Carbon\Carbon;
use Filament\Facades\Filament;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\Concerns\InteractsWithPageFilters;
use Filament\Widgets\TableWidget as BaseWidget;
use Illuminate\Support\Facades\DB;

class TopProductsByViews extends BaseWidget
{
    use InteractsWithPageFilters;

    protected static ?int $sort = 5;

    protected int | string | array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        $store = Filament::getTenant();

        $startDate = Carbon::parse($this->filters['start_date'] ?? now()->subDays(30));
        $endDate = Carbon::parse($this->filters['end_date'] ?? now())->endOfDay();

        return $table
            ->heading('Top produits par visites')
            ->query(
                Product::query()
                    ->where('store_id', $store->id)
                    ->withCount(['pageEvents as views_count' => function ($q) use ($startDate, $endDate) {
                        $q->where('event_type', 'page_view')
                            ->whereBetween('created_at', [$startDate, $endDate]);
                    }])
                    ->withCount(['pageEvents as checkouts_count' => function ($q) use ($startDate, $endDate) {
                        $q->where('event_type', 'checkout_initiate')
                            ->whereBetween('created_at', [$startDate, $endDate]);
                    }])
                    ->withCount(['orders as paid_orders_count' => function ($q) use ($startDate, $endDate) {
                        $q->where('status', 'paid')
                            ->whereBetween('created_at', [$startDate, $endDate]);
                    }])
                    ->orderByDesc('views_count')
            )
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Produit')
                    ->limit(40),

                Tables\Columns\TextColumn::make('views_count')
                    ->label('Vues')
                    ->sortable(),

                Tables\Columns\TextColumn::make('checkouts_count')
                    ->label('Checkouts')
                    ->sortable(),

                Tables\Columns\TextColumn::make('paid_orders_count')
                    ->label('Ventes')
                    ->sortable(),

                Tables\Columns\TextColumn::make('conversion')
                    ->label('Conversion')
                    ->getStateUsing(function (Product $record): string {
                        if ($record->views_count === 0) return '—';
                        return round($record->paid_orders_count / $record->views_count * 100, 1) . '%';
                    }),
            ])
            ->paginated(false)
            ->defaultSort('views_count', 'desc');
    }
}
