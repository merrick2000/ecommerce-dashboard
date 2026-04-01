<?php

namespace App\Filament\Resources\ProductResource\Pages;

use App\Filament\Resources\ProductResource;
use Filament\Facades\Filament;
use Filament\Resources\Pages\CreateRecord;

class CreateProduct extends CreateRecord
{
    protected static string $resource = ProductResource::class;

    public static bool $formActionsAreSticky = true;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['base_currency'] = Filament::getTenant()->currency;

        return $data;
    }
}
