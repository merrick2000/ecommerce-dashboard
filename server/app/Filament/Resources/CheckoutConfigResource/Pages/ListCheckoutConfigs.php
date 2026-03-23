<?php

namespace App\Filament\Resources\CheckoutConfigResource\Pages;

use App\Filament\Resources\CheckoutConfigResource;
use App\Models\CheckoutConfig;
use Filament\Actions;
use Filament\Facades\Filament;
use Filament\Resources\Pages\ListRecords;

class ListCheckoutConfigs extends ListRecords
{
    protected static string $resource = CheckoutConfigResource::class;

    public function mount(): void
    {
        parent::mount();

        // HasOne : s'il existe déjà un config pour ce store, rediriger vers l'édition
        $tenant = Filament::getTenant();

        if ($tenant) {
            $existing = CheckoutConfig::where('store_id', $tenant->id)->first();

            if ($existing) {
                redirect(CheckoutConfigResource::getUrl('edit', [
                    'record' => $existing,
                    'tenant' => $tenant,
                ]));
            }
        }
    }

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make()->label('Nouvelle configuration'),
        ];
    }
}
