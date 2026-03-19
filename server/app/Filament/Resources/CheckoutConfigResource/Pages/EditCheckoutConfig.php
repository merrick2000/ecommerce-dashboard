<?php

namespace App\Filament\Resources\CheckoutConfigResource\Pages;

use App\Filament\Resources\CheckoutConfigResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditCheckoutConfig extends EditRecord
{
    protected static string $resource = CheckoutConfigResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
