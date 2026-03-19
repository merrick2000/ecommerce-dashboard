<?php

namespace App\Filament\Pages\Auth;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Form;
use Filament\Pages\Auth\Register as BaseRegister;

class Register extends BaseRegister
{
    public function form(Form $form): Form
    {
        return $form
            ->schema([
                TextInput::make('name')
                    ->label('Nom')
                    ->required()
                    ->maxLength(255),

                TextInput::make('first_name')
                    ->label('Prénom')
                    ->required()
                    ->maxLength(255),

                $this->getEmailFormComponent(),

                TextInput::make('phone')
                    ->label('Téléphone')
                    ->tel()
                    ->required()
                    ->maxLength(20),

                Select::make('country')
                    ->label('Pays')
                    ->required()
                    ->searchable()
                    ->options([
                        'BJ' => 'Bénin',
                        'BF' => 'Burkina Faso',
                        'CI' => 'Côte d\'Ivoire',
                        'GN' => 'Guinée',
                        'ML' => 'Mali',
                        'NE' => 'Niger',
                        'SN' => 'Sénégal',
                        'TG' => 'Togo',
                        'CM' => 'Cameroun',
                        'GA' => 'Gabon',
                        'CG' => 'Congo',
                        'CD' => 'RD Congo',
                        'MG' => 'Madagascar',
                        'FR' => 'France',
                        'BE' => 'Belgique',
                        'CA' => 'Canada',
                        'OTHER' => 'Autre',
                    ]),

                Select::make('product_type')
                    ->label('Type de produit à vendre')
                    ->required()
                    ->options([
                        'ebook' => 'E-book / PDF',
                        'formation' => 'Formation en ligne',
                        'template' => 'Templates / Modèles',
                        'logiciel' => 'Logiciel / SaaS',
                        'musique' => 'Musique / Audio',
                        'graphisme' => 'Graphisme / Design',
                        'coaching' => 'Coaching / Consulting',
                        'autre' => 'Autre',
                    ]),

                $this->getPasswordFormComponent(),
                $this->getPasswordConfirmationFormComponent(),
            ]);
    }
}
