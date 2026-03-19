<?php

namespace App\Filament\Widgets;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Store;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Carbon;

class RevenueChart extends ChartWidget
{
    protected static ?string $heading = 'Ventes des 7 derniers jours';

    protected static ?int $sort = 2;

    protected function getData(): array
    {
        $user = auth()->user();
        $storeIds = Store::where('user_id', $user->id)->pluck('id');

        $data = collect(range(6, 0))->map(function ($daysAgo) use ($storeIds) {
            $date = now()->subDays($daysAgo);

            return [
                'date' => $date->format('D d'),
                'revenue' => Order::whereIn('store_id', $storeIds)
                    ->where('status', OrderStatus::PAID)
                    ->whereDate('created_at', $date)
                    ->sum('amount'),
            ];
        });

        return [
            'datasets' => [
                [
                    'label' => 'Revenus (FCFA)',
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
