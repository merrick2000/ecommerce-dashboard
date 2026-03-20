<?php

namespace App\Filament\Widgets;

use App\Enums\OrderStatus;
use App\Models\Order;
use Filament\Facades\Filament;
use Filament\Widgets\ChartWidget;

class RevenueChart extends ChartWidget
{
    protected static ?string $heading = 'Ventes des 7 derniers jours';

    protected static ?int $sort = 2;

    protected function getData(): array
    {
        $store = Filament::getTenant();

        $data = collect(range(6, 0))->map(function ($daysAgo) use ($store) {
            $date = now()->subDays($daysAgo);

            return [
                'date' => $date->format('D d'),
                'revenue' => Order::where('store_id', $store->id)
                    ->where('status', OrderStatus::PAID)
                    ->whereDate('created_at', $date)
                    ->sum('amount'),
            ];
        });

        return [
            'datasets' => [
                [
                    'label' => 'Revenus (' . $store->currency . ')',
                    'data' => $data->pluck('revenue')->toArray(),
                    'backgroundColor' => 'rgba(245, 158, 11, 0.1)',
                    'borderColor' => 'rgb(245, 158, 11)',
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
