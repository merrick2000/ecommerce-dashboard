<?php

namespace App\Filament\Resources;

use App\Filament\Resources\StoreResource\Pages;
use App\Models\Store;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Str;

class StoreResource extends Resource
{
    protected static ?string $model = Store::class;

    protected static ?string $navigationIcon = 'heroicon-o-building-storefront';

    protected static ?string $navigationLabel = 'Boutiques';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
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
                            ->unique(ignoreRecord: true)
                            ->maxLength(255)
                            ->helperText('URL publique : /votre-slug'),

                        Forms\Components\Grid::make(2)
                            ->schema([
                                Forms\Components\Select::make('currency')
                                    ->label('Devise')
                                    ->options([
                                        'XOF' => 'XOF (FCFA)',
                                        'XAF' => 'XAF (FCFA Central)',
                                        'EUR' => 'EUR (€)',
                                        'USD' => 'USD ($)',
                                    ])
                                    ->default('XOF')
                                    ->required(),

                                Forms\Components\Select::make('locale')
                                    ->label('Langue de la boutique')
                                    ->options([
                                        'fr' => 'Français',
                                        'en' => 'English',
                                    ])
                                    ->default('fr')
                                    ->required(),
                            ]),

                        Forms\Components\Hidden::make('user_id')
                            ->default(fn () => auth()->id()),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Nom')
                    ->searchable(),

                Tables\Columns\TextColumn::make('slug')
                    ->label('Slug')
                    ->copyable()
                    ->color('primary'),

                Tables\Columns\TextColumn::make('currency')
                    ->label('Devise')
                    ->badge(),

                Tables\Columns\TextColumn::make('locale')
                    ->label('Langue')
                    ->badge()
                    ->formatStateUsing(fn (string $state) => $state === 'fr' ? 'FR' : 'EN')
                    ->color(fn (string $state) => $state === 'fr' ? 'info' : 'warning'),

                Tables\Columns\TextColumn::make('products_count')
                    ->label('Produits')
                    ->counts('products'),

                Tables\Columns\TextColumn::make('orders_count')
                    ->label('Commandes')
                    ->counts('orders'),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Créé le')
                    ->dateTime('d/m/Y')
                    ->sortable(),
            ])
            ->filters([])
            ->actions([
                Tables\Actions\Action::make('preview')
                    ->label('Preview')
                    ->icon('heroicon-o-eye')
                    ->color('success')
                    ->url(fn (Store $record): string =>
                        (env('FRONTEND_URL', 'http://localhost:3000')) . '/' . $record->slug
                    )
                    ->openUrlInNewTab(),
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListStores::route('/'),
            'create' => Pages\CreateStore::route('/create'),
            'edit' => Pages\EditStore::route('/{record}/edit'),
        ];
    }
}
