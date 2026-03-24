<?php

namespace App\Filament\Pages\Tenancy;

use Filament\Forms;
use Filament\Forms\Form;
use Filament\Pages\Tenancy\EditTenantProfile;
use Illuminate\Support\Str;

class EditStore extends EditTenantProfile
{
    public static function getLabel(): string
    {
        return 'Paramètres boutique';
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Informations de la boutique')
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
                            ->unique('stores', 'slug', ignoreRecord: true)
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
                                    ->required(),

                                Forms\Components\Select::make('locale')
                                    ->label('Langue')
                                    ->options([
                                        'fr' => 'Francais',
                                        'en' => 'English',
                                    ])
                                    ->required(),
                            ]),
                    ]),

                Forms\Components\Section::make('Domaine personnalisé')
                    ->description('Configurez un sous-domaine Sellit ou votre propre domaine.')
                    ->schema([
                        Forms\Components\TextInput::make('subdomain')
                            ->label('Sous-domaine Sellit')
                            ->prefix('https://')
                            ->suffix('.sellit.com')
                            ->unique('stores', 'subdomain', ignoreRecord: true)
                            ->maxLength(63)
                            ->alphaNum()
                            ->helperText('Ex: maboutique → maboutique.sellit.com'),

                        Forms\Components\TextInput::make('custom_domain')
                            ->label('Domaine personnalisé')
                            ->placeholder('shop.monbrand.com')
                            ->unique('stores', 'custom_domain', ignoreRecord: true)
                            ->maxLength(255)
                            ->helperText('Ajoutez un CNAME vers votre serveur Sellit. SSL automatique.'),
                    ])->columns(2),
            ]);
    }
}
