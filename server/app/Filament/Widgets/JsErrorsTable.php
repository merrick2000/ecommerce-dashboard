<?php

namespace App\Filament\Widgets;

use App\Models\PageEvent;
use Carbon\Carbon;
use Filament\Facades\Filament;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\Concerns\InteractsWithPageFilters;
use Filament\Widgets\TableWidget as BaseWidget;
use Illuminate\Support\Facades\DB;

class JsErrorsTable extends BaseWidget
{
    use InteractsWithPageFilters;

    protected static ?int $sort = 10;

    protected int | string | array $columnSpan = 'full';

    public function getTableRecordKey(\Illuminate\Database\Eloquent\Model $record): string
    {
        return $record->error_message . '|' . $record->source_file;
    }

    public function table(Table $table): Table
    {
        $store = Filament::getTenant();

        $startDate = Carbon::parse($this->filters['start_date'] ?? now()->subDays(30));
        $endDate = Carbon::parse($this->filters['end_date'] ?? now())->endOfDay();

        return $table
            ->heading('Erreurs JavaScript')
            ->query(
                PageEvent::query()
                    ->select(
                        DB::raw("metadata->>'message' as error_message"),
                        DB::raw("metadata->>'source' as source_file"),
                        DB::raw("metadata->>'line' as error_line"),
                        DB::raw('COUNT(*) as occurrences'),
                        DB::raw('MAX(created_at) as last_seen'),
                    )
                    ->where('store_id', $store->id)
                    ->where('event_type', 'js_error')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->groupBy('error_message', 'source_file', 'error_line')
                    ->orderByDesc('occurrences')
            )
            ->columns([
                Tables\Columns\TextColumn::make('error_message')
                    ->label('Erreur')
                    ->limit(80)
                    ->wrap()
                    ->searchable(query: fn ($query, $search) => $query->having(DB::raw("metadata->>'message'"), 'ilike', "%{$search}%")),

                Tables\Columns\TextColumn::make('source_file')
                    ->label('Fichier')
                    ->limit(40)
                    ->default('-'),

                Tables\Columns\TextColumn::make('error_line')
                    ->label('Ligne')
                    ->default('-'),

                Tables\Columns\TextColumn::make('occurrences')
                    ->label('Occurrences')
                    ->badge()
                    ->color(fn (int $state): string => match (true) {
                        $state >= 10 => 'danger',
                        $state >= 3 => 'warning',
                        default => 'gray',
                    })
                    ->sortable(),

                Tables\Columns\TextColumn::make('last_seen')
                    ->label('Derniere')
                    ->dateTime('d/m H:i')
                    ->sortable(),
            ])
            ->paginated(false)
            ->emptyStateHeading('Aucune erreur JS')
            ->emptyStateDescription('Aucune erreur JavaScript detectee sur la periode')
            ->emptyStateIcon('heroicon-o-check-circle');
    }
}
