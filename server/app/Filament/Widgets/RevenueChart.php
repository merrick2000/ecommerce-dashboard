<?php

namespace App\Filament\Widgets;

use App\Enums\OrderStatus;
use App\Models\Order;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Filament\Facades\Filament;
use Filament\Widgets\ChartWidget;
use Filament\Widgets\Concerns\InteractsWithPageFilters;
use Illuminate\Support\Facades\DB;

class RevenueChart extends ChartWidget
{
    use InteractsWithPageFilters;

    protected static ?string $heading = 'Revenus sur la période';

    protected static ?int $sort = 2;

    protected function getData(): array
    {
        $store = Filament::getTenant();

        $startDate = Carbon::parse($this->filters['start_date'] ?? now()->subDays(7));
        $endDate = Carbon::parse($this->filters['end_date'] ?? now());

        // Devise majoritaire des commandes payées
        $mainCurrency = Order::where('store_id', $store->id)
            ->where('status', OrderStatus::PAID)
            ->select('currency', DB::raw('COUNT(*) as cnt'))
            ->groupBy('currency')
            ->orderByDesc('cnt')
            ->value('currency') ?? $store->currency;

        $period = CarbonPeriod::create($startDate, $endDate);

        $data = collect($period)->map(function ($date) use ($store, $mainCurrency) {
            return [
                'date' => $date->format('d/m'),
                'revenue' => Order::where('store_id', $store->id)
                    ->where('status', OrderStatus::PAID)
                    ->where('currency', $mainCurrency)
                    ->whereDate('created_at', $date)
                    ->sum('amount'),
            ];
        });

        return [
            'datasets' => [
                [
                    'label' => 'Revenus (' . $mainCurrency . ')',
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
