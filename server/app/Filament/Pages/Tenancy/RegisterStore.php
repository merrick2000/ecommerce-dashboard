<?php

namespace App\Filament\Pages\Tenancy;

use Filament\Forms;
use Filament\Forms\Form;
use Filament\Pages\Tenancy\RegisterTenant;
use Illuminate\Support\Str;

class RegisterStore extends RegisterTenant
{
    public static function getLabel(): string
    {
        return 'Nouvelle boutique';
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('name')
                    ->label('Nom de la boutique')
                    ->required()
                    ->maxLength(255)
                    ->live(onBlur: true)
                    ->afterStateUpdated(fn (Forms\Set $set, ?string $state) =>
                        $set('slug', Str::slug($state))
                    ),

                Forms\Components\TextInput::make('slug')
                    ->label('Slug (URL)')
                    ->required()
                    ->unique('stores', 'slug')
                    ->maxLength(255)
                    ->helperText('URL publique de votre boutique'),

                Forms\Components\Grid::make(2)
                    ->schema([
                        Forms\Components\Select::make('currency')
                            ->label('Devise')
                            ->options([
                                'XOF' => 'XOF (FCFA)',
                                'XAF' => 'XAF (FCFA Central)',
                                'EUR' => 'EUR',
                                'USD' => 'USD',
                            ])
                            ->default('XOF')
                            ->required(),

                        Forms\Components\Select::make('locale')
                            ->label('Langue')
                            ->options([
                                'fr' => 'Francais',
                                'en' => 'English',
                            ])
                            ->default('fr')
                            ->required(),
                    ]),
            ]);
    }

    protected function handleRegistration(array $data): \App\Models\Store
    {
        $store = \App\Models\Store::create([
            ...$data,
            'user_id' => auth()->id(),
        ]);

        return $store;
    }
}
