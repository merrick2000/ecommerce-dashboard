<?php

namespace App\Filament\Widgets;

use App\Models\PageEvent;
use Filament\Facades\Filament;
use Filament\Widgets\ChartWidget;

class ViewsOverTimeChart extends ChartWidget
{
    protected static ?string $heading = 'Visites des 14 derniers jours';

    protected static ?int $sort = 4;

    protected function getData(): array
    {
        $store = Filament::getTenant();

        $data = collect(range(13, 0))->map(function ($daysAgo) use ($store) {
            $date = now()->subDays($daysAgo);

            $views = PageEvent::where('store_id', $store->id)
                ->where('event_type', 'page_view')
                ->whereDate('created_at', $date)
                ->count();

            $unique = PageEvent::where('store_id', $store->id)
                ->where('event_type', 'page_view')
                ->whereDate('created_at', $date)
                ->distinct('session_id')
                ->count('session_id');

            return [
                'date' => $date->format('d/m'),
                'views' => $views,
                'unique' => $unique,
            ];
        });

        return [
            'datasets' => [
                [
                    'label' => 'Pages vues',
                    'data' => $data->pluck('views')->toArray(),
                    'backgroundColor' => 'rgba(59, 130, 246, 0.1)',
                    'borderColor' => 'rgb(59, 130, 246)',
                    'fill' => true,
                    'tension' => 0.3,
                ],
                [
                    'label' => 'Visiteurs uniques',
                    'data' => $data->pluck('unique')->toArray(),
                    'backgroundColor' => 'rgba(16, 185, 129, 0.1)',
                    'borderColor' => 'rgb(16, 185, 129)',
                    'fill' => true,
                    'tension' => 0.3,
                ],
            ],
            'labels' => $data->pluck('date')->toArray(),
        ];
    }

    protected function getType(): string
    {
        return 'line';
    }
}
