<?php

namespace App\Filament\Pages;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Section;
use Filament\Forms\Form;
use Filament\Pages\Dashboard as BaseDashboard;
use Filament\Pages\Dashboard\Concerns\HasFiltersForm;

class Dashboard extends BaseDashboard
{
    use HasFiltersForm;

    public function filtersForm(Form $form): Form
    {
        return $form
            ->schema([
                Section::make()
                    ->schema([
                        DatePicker::make('start_date')
                            ->label('Date début')
                            ->default(now()->subDays(30)->toDateString())
                            ->native(false)
                            ->maxDate(now()),

                        DatePicker::make('end_date')
                            ->label('Date fin')
                            ->default(now()->toDateString())
                            ->native(false)
                            ->maxDate(now()),
                    ])
                    ->columns(2),
            ]);
    }
}
