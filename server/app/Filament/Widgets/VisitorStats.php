<?php

namespace App\Filament\Widgets;

use App\Models\PageEvent;
use Carbon\Carbon;
use Filament\Facades\Filament;
use Filament\Widgets\Concerns\InteractsWithPageFilters;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class VisitorStats extends BaseWidget
{
    use InteractsWithPageFilters;

    protected static ?int $sort = 0;

    protected function getStats(): array
    {
        $store = Filament::getTenant();
        $storeId = $store->id;

        $startDate = Carbon::parse($this->filters['start_date'] ?? now()->subDays(30));
        $endDate = Carbon::parse($this->filters['end_date'] ?? now())->endOfDay();

        $base = PageEvent::where('store_id', $storeId)
            ->where('event_type', 'page_view')
            ->whereBetween('created_at', [$startDate, $endDate]);

        $totalVisitors = (clone $base)->distinct('session_id')->count('session_id');
        $totalViews = (clone $base)->count();

        // Comparaison avec période précédente de même durée
        $days = $startDate->diffInDays($endDate) ?: 1;
        $prevStart = $startDate->copy()->subDays($days);
        $prevEnd = $startDate->copy()->subSecond();

        $prevVisitors = PageEvent::where('store_id', $storeId)
            ->where('event_type', 'page_view')
            ->whereBetween('created_at', [$prevStart, $prevEnd])
            ->distinct('session_id')->count('session_id');

        $change = $prevVisitors > 0
            ? round(($totalVisitors - $prevVisitors) / $prevVisitors * 100)
            : ($totalVisitors > 0 ? 100 : 0);

        $avgPerDay = $days > 0 ? round($totalVisitors / $days) : $totalVisitors;

        return [
            Stat::make('Visiteurs uniques', number_format($totalVisitors))
                ->description($change >= 0 ? "+{$change}% vs période précédente" : "{$change}% vs période précédente")
                ->descriptionIcon($change >= 0 ? 'heroicon-m-arrow-trending-up' : 'heroicon-m-arrow-trending-down')
                ->color($change >= 0 ? 'success' : 'danger'),

            Stat::make('Pages vues', number_format($totalViews))
                ->descriptionIcon('heroicon-m-eye')
                ->description('total sur la période')
                ->color('info'),

            Stat::make('Moyenne / jour', $avgPerDay)
                ->descriptionIcon('heroicon-m-calendar')
                ->description('visiteurs uniques')
                ->color('warning'),
        ];
    }
}
