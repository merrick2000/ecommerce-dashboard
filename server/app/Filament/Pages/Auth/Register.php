<?php

namespace App\Filament\Pages\Auth;

use Filament\Forms\Components\Grid;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Form;
use Filament\Forms\Get;
use Filament\Pages\Auth\Register as BaseRegister;

class Register extends BaseRegister
{
    private const COUNTRY_DIAL_CODES = [
        'BJ' => '+229',
        'BF' => '+226',
        'CI' => '+225',
        'GN' => '+224',
        'ML' => '+223',
        'NE' => '+227',
        'SN' => '+221',
        'TG' => '+228',
        'CM' => '+237',
        'GA' => '+241',
        'CG' => '+242',
        'CD' => '+243',
        'MG' => '+261',
        'GH' => '+233',
        'NG' => '+234',
        'KE' => '+254',
        'MA' => '+212',
        'TN' => '+216',
        'FR' => '+33',
        'BE' => '+32',
        'CA' => '+1',
        'GB' => '+44',
        'US' => '+1',
        'OTHER' => '',
    ];

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

                Select::make('country')
                    ->label('Pays')
                    ->required()
                    ->searchable()
                    ->live()
                    ->options([
                        'BJ' => '🇧🇯 Bénin',
                        'BF' => '🇧🇫 Burkina Faso',
                        'CI' => '🇨🇮 Côte d\'Ivoire',
                        'GN' => '🇬🇳 Guinée',
                        'ML' => '🇲🇱 Mali',
                        'NE' => '🇳🇪 Niger',
                        'SN' => '🇸🇳 Sénégal',
                        'TG' => '🇹🇬 Togo',
                        'CM' => '🇨🇲 Cameroun',
                        'GA' => '🇬🇦 Gabon',
                        'CG' => '🇨🇬 Congo',
                        'CD' => '🇨🇩 RD Congo',
                        'MG' => '🇲🇬 Madagascar',
                        'GH' => '🇬🇭 Ghana',
                        'NG' => '🇳🇬 Nigeria',
                        'KE' => '🇰🇪 Kenya',
                        'MA' => '🇲🇦 Maroc',
                        'TN' => '🇹🇳 Tunisie',
                        'FR' => '🇫🇷 France',
                        'BE' => '🇧🇪 Belgique',
                        'CA' => '🇨🇦 Canada',
                        'GB' => '🇬🇧 Royaume-Uni',
                        'US' => '🇺🇸 États-Unis',
                        'OTHER' => 'Autre',
                    ]),

                TextInput::make('phone')
                    ->label('Téléphone')
                    ->tel()
                    ->required()
                    ->maxLength(20)
                    ->prefix(fn (Get $get): string => self::COUNTRY_DIAL_CODES[$get('country') ?? ''] ?? '')
                    ->placeholder(fn (Get $get): string => match ($get('country')) {
                        'BJ' => '97 00 00 00',
                        'SN' => '77 123 45 67',
                        'CI' => '07 00 00 00 00',
                        'CM' => '6 70 00 00 00',
                        'FR' => '6 12 34 56 78',
                        default => '00 00 00 00',
                    }),

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

    protected function mutateFormDataBeforeRegister(array $data): array
    {
        // Préfixer le numéro avec l'indicatif du pays
        $dialCode = self::COUNTRY_DIAL_CODES[$data['country'] ?? ''] ?? '';
        if ($dialCode && ! str_starts_with($data['phone'], $dialCode)) {
            $data['phone'] = $dialCode . $data['phone'];
        }

        return $data;
    }
}
