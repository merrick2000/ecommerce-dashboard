<?php

namespace App\Filament\Resources\CheckoutConfigResource\Pages;

use App\Filament\Resources\CheckoutConfigResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListCheckoutConfigs extends ListRecords
{
    protected static string $resource = CheckoutConfigResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make()->label('Nouvelle configuration'),
        ];
    }
}
