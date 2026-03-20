<?php

namespace App\Filament\Widgets;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Product;
use Filament\Facades\Filament;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Number;

class StatsOverview extends BaseWidget
{
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        $store = Filament::getTenant();

        $totalRevenue = Order::where('store_id', $store->id)
            ->where('status', OrderStatus::PAID)
            ->sum('amount');

        $totalOrders = Order::where('store_id', $store->id)
            ->where('status', OrderStatus::PAID)
            ->count();

        $last7DaysRevenue = Order::where('store_id', $store->id)
            ->where('status', OrderStatus::PAID)
            ->where('created_at', '>=', now()->subDays(7))
            ->sum('amount');

        $previous7DaysRevenue = Order::where('store_id', $store->id)
            ->where('status', OrderStatus::PAID)
            ->whereBetween('created_at', [now()->subDays(14), now()->subDays(7)])
            ->sum('amount');

        $revenueChange = $previous7DaysRevenue > 0
            ? round((($last7DaysRevenue - $previous7DaysRevenue) / $previous7DaysRevenue) * 100)
            : ($last7DaysRevenue > 0 ? 100 : 0);

        $totalProducts = Product::where('store_id', $store->id)->count();

        return [
            Stat::make('Revenus totaux', Number::format($totalRevenue) . ' ' . $store->currency)
                ->description($totalOrders . ' commandes payées')
                ->descriptionIcon('heroicon-m-banknotes')
                ->color('success'),

            Stat::make('Ventes (7 jours)', Number::format($last7DaysRevenue) . ' ' . $store->currency)
                ->description($revenueChange >= 0 ? "+{$revenueChange}% vs semaine précédente" : "{$revenueChange}% vs semaine précédente")
                ->descriptionIcon($revenueChange >= 0 ? 'heroicon-m-arrow-trending-up' : 'heroicon-m-arrow-trending-down')
                ->color($revenueChange >= 0 ? 'success' : 'danger'),

            Stat::make('Produits', $totalProducts)
                ->description($store->name)
                ->descriptionIcon('heroicon-m-cube')
                ->color('info'),
        ];
    }
}
