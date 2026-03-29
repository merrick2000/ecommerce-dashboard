<?php

namespace App\Filament\Widgets;

use App\Models\PageEvent;
use Carbon\Carbon;
use Filament\Facades\Filament;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\Concerns\InteractsWithPageFilters;
use Filament\Widgets\TableWidget as BaseWidget;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

class TrafficSources extends BaseWidget
{
    use InteractsWithPageFilters;

    protected static ?int $sort = 6;

    protected int | string | array $columnSpan = 'full';

    public function getTableRecordKey(\Illuminate\Database\Eloquent\Model $record): string
    {
        return $record->source_name . '|' . $record->medium . '|' . $record->campaign;
    }

    public function table(Table $table): Table
    {
        $store = Filament::getTenant();

        $startDate = Carbon::parse($this->filters['start_date'] ?? now()->subDays(30));
        $endDate = Carbon::parse($this->filters['end_date'] ?? now())->endOfDay();

        return $table
            ->heading('Sources de trafic')
            ->query(
                PageEvent::query()
                    ->select(
                        DB::raw("COALESCE(NULLIF(utm_source, ''), CASE
                            WHEN referrer LIKE '%facebook%' OR referrer LIKE '%fb.%' THEN 'facebook'
                            WHEN referrer LIKE '%instagram%' THEN 'instagram'
                            WHEN referrer LIKE '%tiktok%' THEN 'tiktok'
                            WHEN referrer LIKE '%google%' THEN 'google'
                            WHEN referrer LIKE '%twitter%' OR referrer LIKE '%t.co%' THEN 'twitter'
                            WHEN referrer IS NOT NULL AND referrer != '' THEN referrer
                            ELSE 'direct'
                        END) as source_name"),
                        DB::raw("COALESCE(NULLIF(utm_medium, ''), 'organic') as medium"),
                        DB::raw('COALESCE(utm_campaign, \'\') as campaign'),
                        DB::raw('COUNT(*) as visits'),
                        DB::raw('COUNT(DISTINCT session_id) as unique_visitors'),
                    )
                    ->where('store_id', $store->id)
                    ->where('event_type', 'page_view')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->groupBy('source_name', 'medium', 'campaign')
                    ->orderByDesc('unique_visitors')
            )
            ->columns([
                Tables\Columns\TextColumn::make('source_name')
                    ->label('Source')
                    ->badge()
                    ->color(fn (string $state): string => match (true) {
                        str_contains($state, 'facebook') || str_contains($state, 'fb') => 'info',
                        str_contains($state, 'instagram') => 'danger',
                        str_contains($state, 'tiktok') => 'warning',
                        str_contains($state, 'google') => 'success',
                        $state === 'direct' => 'gray',
                        default => 'primary',
                    }),

                Tables\Columns\TextColumn::make('medium')
                    ->label('Medium')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'cpc', 'paid' => 'warning',
                        'social' => 'info',
                        'email' => 'success',
                        default => 'gray',
                    }),

                Tables\Columns\TextColumn::make('campaign')
                    ->label('Campagne')
                    ->default('—')
                    ->limit(30),

                Tables\Columns\TextColumn::make('unique_visitors')
                    ->label('Visiteurs uniques')
                    ->sortable()
                    ->badge()
                    ->color('success'),

                Tables\Columns\TextColumn::make('visits')
                    ->label('Visites')
                    ->sortable(),
            ])
            ->paginated(false)
            ->defaultSort('unique_visitors', 'desc');
    }
}
