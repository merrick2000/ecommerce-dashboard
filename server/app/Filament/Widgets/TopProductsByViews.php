<?php

namespace App\Filament\Widgets;

use App\Models\PageEvent;
use App\Models\Product;
use Filament\Facades\Filament;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class TopProductsByViews extends BaseWidget
{
    protected static ?int $sort = 5;

    protected int | string | array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        $store = Filament::getTenant();

        return $table
            ->heading('Top produits par visites (30 jours)')
            ->query(
                Product::query()
                    ->where('store_id', $store->id)
                    ->withCount(['pageEvents as views_count' => function ($q) {
                        $q->where('event_type', 'page_view')
                            ->where('created_at', '>=', now()->subDays(30));
                    }])
                    ->withCount(['pageEvents as unique_visitors' => function ($q) {
                        $q->where('event_type', 'page_view')
                            ->where('created_at', '>=', now()->subDays(30))
                            ->select(\Illuminate\Support\Facades\DB::raw('count(distinct session_id)'));
                    }])
                    ->withCount(['pageEvents as checkouts_count' => function ($q) {
                        $q->where('event_type', 'checkout_initiate')
                            ->where('created_at', '>=', now()->subDays(30));
                    }])
                    ->withCount(['orders as paid_orders_count' => function ($q) {
                        $q->where('status', 'paid')
                            ->where('created_at', '>=', now()->subDays(30));
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
