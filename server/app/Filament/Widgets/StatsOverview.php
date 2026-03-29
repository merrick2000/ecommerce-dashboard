<?php

namespace App\Filament\Widgets;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Product;
use Carbon\Carbon;
use Filament\Facades\Filament;
use Filament\Widgets\Concerns\InteractsWithPageFilters;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Number;

class StatsOverview extends BaseWidget
{
    use InteractsWithPageFilters;

    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        $store = Filament::getTenant();

        $startDate = Carbon::parse($this->filters['start_date'] ?? now()->subDays(30));
        $endDate = Carbon::parse($this->filters['end_date'] ?? now())->endOfDay();

        $revenue = Order::where('store_id', $store->id)
            ->where('status', OrderStatus::PAID)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('amount');

        $paidOrders = Order::where('store_id', $store->id)
            ->where('status', OrderStatus::PAID)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        // Comparaison avec période précédente
        $days = $startDate->diffInDays($endDate) ?: 1;
        $prevStart = $startDate->copy()->subDays($days);
        $prevEnd = $startDate->copy()->subSecond();

        $prevRevenue = Order::where('store_id', $store->id)
            ->where('status', OrderStatus::PAID)
            ->whereBetween('created_at', [$prevStart, $prevEnd])
            ->sum('amount');

        $revenueChange = $prevRevenue > 0
            ? round(($revenue - $prevRevenue) / $prevRevenue * 100)
            : ($revenue > 0 ? 100 : 0);

        $totalProducts = Product::where('store_id', $store->id)->count();

        return [
            Stat::make('Revenus', Number::format($revenue) . ' ' . $store->currency)
                ->description($paidOrders . ' commandes payées')
                ->descriptionIcon('heroicon-m-banknotes')
                ->color('success'),

            Stat::make('Tendance', Number::format($revenue) . ' ' . $store->currency)
                ->description($revenueChange >= 0 ? "+{$revenueChange}% vs période précédente" : "{$revenueChange}% vs période précédente")
                ->descriptionIcon($revenueChange >= 0 ? 'heroicon-m-arrow-trending-up' : 'heroicon-m-arrow-trending-down')
                ->color($revenueChange >= 0 ? 'success' : 'danger'),

            Stat::make('Produits', $totalProducts)
                ->description($store->name)
                ->descriptionIcon('heroicon-m-cube')
                ->color('info'),
        ];
    }
}
