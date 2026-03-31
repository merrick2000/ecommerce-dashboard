<?php

namespace App\Filament\Widgets;

use App\Models\PageEvent;
use Carbon\Carbon;
use Filament\Facades\Filament;
use Filament\Widgets\Concerns\InteractsWithPageFilters;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\DB;

class FrictionAnalysis extends BaseWidget
{
    use InteractsWithPageFilters;

    protected static ?int $sort = 8;

    protected int | string | array $columnSpan = 'full';

    protected function getStats(): array
    {
        $store = Filament::getTenant();
        $storeId = $store->id;

        $startDate = Carbon::parse($this->filters['start_date'] ?? now()->subDays(30));
        $endDate = Carbon::parse($this->filters['end_date'] ?? now())->endOfDay();

        $base = PageEvent::where('store_id', $storeId)
            ->whereBetween('created_at', [$startDate, $endDate]);

        // Sessions uniques qui ont visité
        $totalSessions = (clone $base)->where('event_type', 'page_view')
            ->distinct('session_id')->count('session_id');

        // Sessions qui ont scrollé > 50%
        $scrolled50 = (clone $base)->where('event_type', 'scroll_depth')
            ->whereRaw("(metadata->>'depth')::int >= 50")
            ->distinct('session_id')->count('session_id');

        // Sessions qui ont cliqué un CTA
        $ctaClicks = (clone $base)->where('event_type', 'cta_click')
            ->distinct('session_id')->count('session_id');

        // Sessions qui ont touché le formulaire
        $formFocus = (clone $base)->where('event_type', 'form_focus')
            ->distinct('session_id')->count('session_id');

        // Sessions qui ont initié le checkout
        $checkouts = (clone $base)->where('event_type', 'checkout_initiate')
            ->distinct('session_id')->count('session_id');

        // Sessions payées
        $paid = (clone $base)->where('event_type', 'payment_completed')
            ->distinct('session_id')->count('session_id');

        // Temps moyen sur page (des page_leave events)
        $avgTime = (clone $base)->where('event_type', 'page_leave')
            ->whereNotNull('metadata')
            ->selectRaw("AVG((metadata->>'time_on_page_s')::numeric) as avg_time")
            ->value('avg_time');
        $avgTimeFormatted = $avgTime ? round($avgTime) . 's' : '—';

        // Scroll moyen
        $avgScroll = (clone $base)->where('event_type', 'page_leave')
            ->whereNotNull('metadata')
            ->selectRaw("AVG((metadata->>'max_scroll_pct')::numeric) as avg_scroll")
            ->value('avg_scroll');
        $avgScrollFormatted = $avgScroll ? round($avgScroll) . '%' : '—';

        // Erreurs JS
        $jsErrors = (clone $base)->where('event_type', 'js_error')->count();

        // Calcul des taux de drop
        $scrollRate = $totalSessions > 0 ? round($scrolled50 / $totalSessions * 100) : 0;
        $formRate = $totalSessions > 0 ? round($formFocus / $totalSessions * 100) : 0;
        $checkoutRate = $totalSessions > 0 ? round($checkouts / $totalSessions * 100) : 0;
        $conversionRate = $totalSessions > 0 ? round($paid / $totalSessions * 100, 1) : 0;

        return [
            Stat::make('Temps moyen sur page', $avgTimeFormatted)
                ->description('avant de quitter')
                ->descriptionIcon('heroicon-m-clock')
                ->color('info'),

            Stat::make('Scroll moyen', $avgScrollFormatted)
                ->description("{$scrollRate}% scrollent > 50%")
                ->descriptionIcon('heroicon-m-arrows-up-down')
                ->color($scrollRate >= 50 ? 'success' : 'warning'),

            Stat::make('Interaction formulaire', "{$formRate}%")
                ->description("{$formFocus} / {$totalSessions} visiteurs")
                ->descriptionIcon('heroicon-m-pencil-square')
                ->color($formRate >= 20 ? 'success' : 'danger'),

            Stat::make('Taux checkout', "{$checkoutRate}%")
                ->description("{$checkouts} / {$totalSessions} visiteurs")
                ->descriptionIcon('heroicon-m-shopping-cart')
                ->color($checkoutRate >= 10 ? 'success' : 'warning'),

            Stat::make('Conversion', "{$conversionRate}%")
                ->description("{$paid} ventes / {$totalSessions} visiteurs")
                ->descriptionIcon('heroicon-m-check-circle')
                ->color($conversionRate >= 2 ? 'success' : 'danger'),

            Stat::make('Erreurs JS', $jsErrors)
                ->description('sur la période')
                ->descriptionIcon('heroicon-m-exclamation-triangle')
                ->color($jsErrors > 0 ? 'danger' : 'success'),
        ];
    }
}
