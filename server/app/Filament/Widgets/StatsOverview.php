<?php

namespace App\Filament\Widgets;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Number;

class StatsOverview extends BaseWidget
{
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        $user = auth()->user();
        $storeIds = Store::where('user_id', $user->id)->pluck('id');

        $totalRevenue = Order::whereIn('store_id', $storeIds)
            ->where('status', OrderStatus::PAID)
            ->sum('amount');

        $totalOrders = Order::whereIn('store_id', $storeIds)
            ->where('status', OrderStatus::PAID)
            ->count();

        $last7DaysRevenue = Order::whereIn('store_id', $storeIds)
            ->where('status', OrderStatus::PAID)
            ->where('created_at', '>=', now()->subDays(7))
            ->sum('amount');

        $previous7DaysRevenue = Order::whereIn('store_id', $storeIds)
            ->where('status', OrderStatus::PAID)
            ->whereBetween('created_at', [now()->subDays(14), now()->subDays(7)])
            ->sum('amount');

        $revenueChange = $previous7DaysRevenue > 0
            ? round((($last7DaysRevenue - $previous7DaysRevenue) / $previous7DaysRevenue) * 100)
            : ($last7DaysRevenue > 0 ? 100 : 0);

        $totalProducts = Product::whereIn('store_id', $storeIds)->count();
        $totalStores = $storeIds->count();

        return [
            Stat::make('Revenus totaux', Number::format($totalRevenue) . ' FCFA')
                ->description($totalOrders . ' commandes payées')
                ->descriptionIcon('heroicon-m-banknotes')
                ->color('success'),

            Stat::make('Ventes (7 derniers jours)', Number::format($last7DaysRevenue) . ' FCFA')
                ->description($revenueChange >= 0 ? "+{$revenueChange}% vs semaine précédente" : "{$revenueChange}% vs semaine précédente")
                ->descriptionIcon($revenueChange >= 0 ? 'heroicon-m-arrow-trending-up' : 'heroicon-m-arrow-trending-down')
                ->color($revenueChange >= 0 ? 'success' : 'danger'),

            Stat::make('Boutiques', $totalStores)
                ->description($totalProducts . ' produits')
                ->descriptionIcon('heroicon-m-building-storefront')
                ->color('info'),
        ];
    }
}
