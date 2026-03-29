<?php

namespace App\Filament\Widgets;

use App\Models\PageEvent;
use Carbon\Carbon;
use Filament\Facades\Filament;
use Filament\Widgets\ChartWidget;
use Filament\Widgets\Concerns\InteractsWithPageFilters;
use Illuminate\Support\Facades\DB;

class DeviceCountryStats extends ChartWidget
{
    use InteractsWithPageFilters;

    protected static ?string $heading = 'Appareils & Pays';

    protected static ?int $sort = 7;

    protected static ?string $maxHeight = '300px';

    public ?string $filter = 'device';

    protected function getFilters(): ?array
    {
        return [
            'device' => 'Par appareil',
            'country' => 'Par pays',
        ];
    }

    protected function getData(): array
    {
        $store = Filament::getTenant();

        $startDate = Carbon::parse($this->filters['start_date'] ?? now()->subDays(30));
        $endDate = Carbon::parse($this->filters['end_date'] ?? now())->endOfDay();

        $base = PageEvent::where('store_id', $store->id)
            ->where('event_type', 'page_view')
            ->whereBetween('created_at', [$startDate, $endDate]);

        if ($this->filter === 'country') {
            $data = (clone $base)
                ->select(
                    DB::raw("COALESCE(NULLIF(country, ''), 'Inconnu') as label"),
                    DB::raw('COUNT(DISTINCT session_id) as total')
                )
                ->groupBy('label')
                ->orderByDesc('total')
                ->limit(10)
                ->get();

            $colors = [
                '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
                '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
            ];
        } else {
            $data = (clone $base)
                ->select(
                    DB::raw("COALESCE(NULLIF(device_type, ''), 'unknown') as label"),
                    DB::raw('COUNT(DISTINCT session_id) as total')
                )
                ->groupBy('label')
                ->orderByDesc('total')
                ->get();

            $colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
        }

        return [
            'datasets' => [
                [
                    'data' => $data->pluck('total')->toArray(),
                    'backgroundColor' => array_slice($colors, 0, $data->count()),
                ],
            ],
            'labels' => $data->pluck('label')->map(fn ($l) => match ($l) {
                'mobile' => 'Mobile',
                'desktop' => 'Desktop',
                'tablet' => 'Tablette',
                'unknown' => 'Inconnu',
                default => $l,
            })->toArray(),
        ];
    }

    protected function getType(): string
    {
        return 'doughnut';
    }
}
