<?php

namespace App\Filament\Widgets;

use App\Models\PageEvent;
use Filament\Facades\Filament;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class ConversionFunnel extends BaseWidget
{
    protected static ?int $sort = 3;

    protected int | string | array $columnSpan = 'full';

    protected function getStats(): array
    {
        $store = Filament::getTenant();
        $storeId = $store->id;
        $since = now()->subDays(30);

        $views = PageEvent::where('store_id', $storeId)
            ->where('event_type', 'page_view')
            ->whereNotNull('product_id')
            ->where('created_at', '>=', $since)
            ->count();

        $initiates = PageEvent::where('store_id', $storeId)
            ->where('event_type', 'checkout_initiate')
            ->where('created_at', '>=', $since)
            ->count();

        $orders = PageEvent::where('store_id', $storeId)
            ->where('event_type', 'order_created')
            ->where('created_at', '>=', $since)
            ->count();

        $paid = PageEvent::where('store_id', $storeId)
            ->where('event_type', 'payment_completed')
            ->where('created_at', '>=', $since)
            ->count();

        $initiateRate = $views > 0 ? round($initiates / $views * 100, 1) : 0;
        $orderRate = $initiates > 0 ? round($orders / $initiates * 100, 1) : 0;
        $payRate = $orders > 0 ? round($paid / $orders * 100, 1) : 0;
        $globalRate = $views > 0 ? round($paid / $views * 100, 1) : 0;

        return [
            Stat::make('Vues produits', $views)
                ->description('30 derniers jours')
                ->descriptionIcon('heroicon-m-eye')
                ->color('gray'),

            Stat::make('Début checkout', $initiates)
                ->description("{$initiateRate}% des vues")
                ->descriptionIcon('heroicon-m-cursor-arrow-rays')
                ->color('info'),

            Stat::make('Commandes', $orders)
                ->description("{$orderRate}% des initiations")
                ->descriptionIcon('heroicon-m-shopping-cart')
                ->color('warning'),

            Stat::make('Paiements', $paid)
                ->description("{$globalRate}% conversion globale")
                ->descriptionIcon('heroicon-m-check-circle')
                ->color('success'),
        ];
    }
}
