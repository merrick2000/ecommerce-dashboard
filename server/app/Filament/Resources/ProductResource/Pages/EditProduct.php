<?php

namespace App\Filament\Resources\ProductResource\Pages;

use App\Filament\Resources\ProductResource;
use Filament\Actions;
use Filament\Facades\Filament;
use Filament\Resources\Pages\EditRecord;

class EditProduct extends EditRecord
{
    protected static string $resource = ProductResource::class;

    public static bool $formActionsAreSticky = true;

    protected function getHeaderActions(): array
    {
        $frontendUrl = config('app.frontend_url', env('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'));
        $tenant = Filament::getTenant();

        return [
            Actions\Action::make('preview_product')
                ->label('Voir le produit')
                ->icon('heroicon-o-eye')
                ->color('info')
                ->url(fn () => $frontendUrl . '/' . $tenant->slug . '/p/' . $this->record->id . '?notrack')
                ->openUrlInNewTab(),

            Actions\Action::make('preview_store')
                ->label('Voir la boutique')
                ->icon('heroicon-o-building-storefront')
                ->color('gray')
                ->url(fn () => $frontendUrl . '/' . $tenant->slug . '?notrack')
                ->openUrlInNewTab(),

            Actions\DeleteAction::make(),
        ];
    }
}
