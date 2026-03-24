<?php

namespace App\Filament\Widgets;

use App\Models\PageEvent;
use Filament\Facades\Filament;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class VisitorStats extends BaseWidget
{
    protected static ?int $sort = 0;

    protected function getStats(): array
    {
        $store = Filament::getTenant();
        $storeId = $store->id;

        $base = PageEvent::where('store_id', $storeId)
            ->where('event_type', 'page_view');

        $today = (clone $base)->where('created_at', '>=', now()->startOfDay())
            ->distinct('session_id')->count('session_id');

        $week = (clone $base)->where('created_at', '>=', now()->startOfWeek())
            ->distinct('session_id')->count('session_id');

        $month = (clone $base)->where('created_at', '>=', now()->startOfMonth())
            ->distinct('session_id')->count('session_id');

        // Comparaison semaine précédente
        $prevWeek = PageEvent::where('store_id', $storeId)
            ->where('event_type', 'page_view')
            ->whereBetween('created_at', [now()->subWeek()->startOfWeek(), now()->startOfWeek()])
            ->distinct('session_id')->count('session_id');

        $weekChange = $prevWeek > 0
            ? round(($week - $prevWeek) / $prevWeek * 100)
            : ($week > 0 ? 100 : 0);

        return [
            Stat::make('Visiteurs aujourd\'hui', $today)
                ->descriptionIcon('heroicon-m-eye')
                ->description('sessions uniques')
                ->color('info'),

            Stat::make('Visiteurs (semaine)', $week)
                ->description($weekChange >= 0 ? "+{$weekChange}% vs semaine précédente" : "{$weekChange}% vs semaine précédente")
                ->descriptionIcon($weekChange >= 0 ? 'heroicon-m-arrow-trending-up' : 'heroicon-m-arrow-trending-down')
                ->color($weekChange >= 0 ? 'success' : 'danger'),

            Stat::make('Visiteurs (mois)', $month)
                ->descriptionIcon('heroicon-m-calendar')
                ->description(now()->translatedFormat('F Y'))
                ->color('warning'),
        ];
    }
}
