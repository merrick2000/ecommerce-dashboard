<?php

namespace App\Filament\Resources\StoreResource\Pages;

use App\Filament\Resources\StoreResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditStore extends EditRecord
{
    protected static string $resource = StoreResource::class;

    public static bool $formActionsAreSticky = true;

    protected function getHeaderActions(): array
    {
        return [
            Actions\Action::make('preview')
                ->label('Preview Checkout')
                ->icon('heroicon-o-eye')
                ->color('success')
                ->url(fn () =>
                    (env('FRONTEND_URL', 'http://localhost:3000')) . '/' . $this->record->slug
                )
                ->openUrlInNewTab(),
            Actions\DeleteAction::make(),
        ];
    }
}
