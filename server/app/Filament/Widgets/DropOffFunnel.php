<?php

namespace App\Filament\Widgets;

use App\Models\PageEvent;
use Carbon\Carbon;
use Filament\Facades\Filament;
use Filament\Widgets\ChartWidget;
use Filament\Widgets\Concerns\InteractsWithPageFilters;
use Illuminate\Support\Facades\DB;

class DropOffFunnel extends ChartWidget
{
    use InteractsWithPageFilters;

    protected static ?string $heading = 'Funnel de friction (drop-off par étape)';

    protected static ?int $sort = 9;

    protected int | string | array $columnSpan = 'full';

    protected static ?string $maxHeight = '350px';

    protected function getData(): array
    {
        $store = Filament::getTenant();
        $storeId = $store->id;

        $startDate = Carbon::parse($this->filters['start_date'] ?? now()->subDays(30));
        $endDate = Carbon::parse($this->filters['end_date'] ?? now())->endOfDay();

        $base = PageEvent::where('store_id', $storeId)
            ->whereBetween('created_at', [$startDate, $endDate]);

        $steps = [
            'page_view' => 'Visite',
            'scroll_depth_50' => 'Scroll > 50%',
            'cta_click' => 'Clic CTA',
            'form_focus' => 'Formulaire',
            'checkout_initiate' => 'Checkout',
            'payment_started' => 'Paiement initié',
            'payment_completed' => 'Payé',
        ];

        $counts = [];

        foreach ($steps as $key => $label) {
            if ($key === 'scroll_depth_50') {
                $counts[$key] = (clone $base)->where('event_type', 'scroll_depth')
                    ->whereRaw("(metadata->>'depth')::int >= 50")
                    ->distinct('session_id')->count('session_id');
            } else {
                $counts[$key] = (clone $base)->where('event_type', $key)
                    ->distinct('session_id')->count('session_id');
            }
        }

        $values = array_values($counts);
        $labels = array_values($steps);

        // Couleurs dégradées vert → rouge
        $colors = [];
        $total = count($values);
        foreach ($values as $i => $v) {
            $ratio = $total > 1 ? $i / ($total - 1) : 0;
            $r = (int) (16 + $ratio * (239 - 16));
            $g = (int) (185 - $ratio * (185 - 68));
            $b = (int) (129 - $ratio * (129 - 68));
            $colors[] = "rgb({$r}, {$g}, {$b})";
        }

        return [
            'datasets' => [
                [
                    'label' => 'Sessions',
                    'data' => $values,
                    'backgroundColor' => $colors,
                    'borderRadius' => 6,
                ],
            ],
            'labels' => $labels,
        ];
    }

    protected function getType(): string
    {
        return 'bar';
    }

    protected function getOptions(): array
    {
        return [
            'indexAxis' => 'y',
            'plugins' => [
                'legend' => ['display' => false],
            ],
            'scales' => [
                'x' => ['beginAtZero' => true],
            ],
        ];
    }
}
