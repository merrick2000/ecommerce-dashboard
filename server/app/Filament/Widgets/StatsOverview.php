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
use Illuminate\Support\Facades\DB;
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

        // Revenus groupés par devise
        $revenueByCurrency = Order::where('store_id', $store->id)
            ->where('status', OrderStatus::PAID)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select('currency', DB::raw('SUM(amount) as total'))
            ->groupBy('currency')
            ->pluck('total', 'currency');

        $revenueFormatted = $revenueByCurrency->map(function ($total, $currency) {
            return Number::format($total) . ' ' . $currency;
        })->implode(' + ') ?: '0 ' . $store->currency;

        $paidOrders = Order::where('store_id', $store->id)
            ->where('status', OrderStatus::PAID)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        // Comparaison avec période précédente (en nombre de commandes, pas en montant mixte)
        $days = $startDate->diffInDays($endDate) ?: 1;
        $prevStart = $startDate->copy()->subDays($days);
        $prevEnd = $startDate->copy()->subSecond();

        $prevOrders = Order::where('store_id', $store->id)
            ->where('status', OrderStatus::PAID)
            ->whereBetween('created_at', [$prevStart, $prevEnd])
            ->count();

        $ordersChange = $prevOrders > 0
            ? round(($paidOrders - $prevOrders) / $prevOrders * 100)
            : ($paidOrders > 0 ? 100 : 0);

        $totalProducts = Product::where('store_id', $store->id)->count();

        return [
            Stat::make('Revenus', $revenueFormatted)
                ->description($paidOrders . ' commandes payées')
                ->descriptionIcon('heroicon-m-banknotes')
                ->color('success'),

            Stat::make('Tendance', $paidOrders . ' ventes')
                ->description($ordersChange >= 0 ? "+{$ordersChange}% vs période précédente" : "{$ordersChange}% vs période précédente")
                ->descriptionIcon($ordersChange >= 0 ? 'heroicon-m-arrow-trending-up' : 'heroicon-m-arrow-trending-down')
                ->color($ordersChange >= 0 ? 'success' : 'danger'),

            Stat::make('Produits', $totalProducts)
                ->description($store->name)
                ->descriptionIcon('heroicon-m-cube')
                ->color('info'),
        ];
    }
}
