<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ProductResource\Pages;
use App\Models\Product;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Storage;

class ProductResource extends Resource
{
    protected static ?string $model = Product::class;

    protected static ?string $navigationIcon = 'heroicon-o-cube';

    protected static ?string $navigationLabel = 'Produits';

    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Informations produit')
                    ->schema([
                        Forms\Components\Select::make('store_id')
                            ->label('Boutique')
                            ->relationship('store', 'name')
                            ->required()
                            ->searchable()
                            ->preload(),

                        Forms\Components\TextInput::make('name')
                            ->label('Nom du produit')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('Ex: Formation React Avancé'),

                        Forms\Components\RichEditor::make('description')
                            ->label('Description (page de vente)')
                            ->toolbarButtons([
                                'bold',
                                'italic',
                                'underline',
                                'strike',
                                'h2',
                                'h3',
                                'bulletList',
                                'orderedList',
                                'link',
                                'blockquote',
                                'attachFiles',
                            ])
                            ->fileAttachmentsDisk('s3')
                            ->fileAttachmentsDirectory('description-images')
                            ->fileAttachmentsVisibility('private')
                            ->placeholder('Décrivez ce que le client va recevoir...'),

                        Forms\Components\TextInput::make('price')
                            ->label('Prix (FCFA)')
                            ->required()
                            ->numeric()
                            ->minValue(0)
                            ->suffix('FCFA')
                            ->placeholder('5000'),
                    ]),

                Forms\Components\Section::make('Ce que vous obtenez')
                    ->description('Liste des avantages affichés sur la page de vente. Choisissez où les placer.')
                    ->schema([
                        Forms\Components\Radio::make('features_position')
                            ->label('Position sur la page')
                            ->options([
                                'above_description' => 'Au-dessus de la description',
                                'below_description' => 'En-dessous de la description',
                                'above_form' => 'Juste au-dessus du formulaire',
                            ])
                            ->default('below_description')
                            ->inline(),

                        Forms\Components\Repeater::make('features')
                            ->label('')
                            ->simple(
                                Forms\Components\TextInput::make('feature')
                                    ->placeholder('Ex: 10 heures de vidéo HD')
                                    ->required(),
                            )
                            ->addActionLabel('Ajouter un avantage')
                            ->reorderable()
                            ->collapsible()
                            ->defaultItems(0),
                    ]),

                Forms\Components\Section::make('FAQ')
                    ->description('Questions fréquentes affichées en bas de la page de vente')
                    ->schema([
                        Forms\Components\Repeater::make('faqs')
                            ->label('')
                            ->schema([
                                Forms\Components\TextInput::make('question')
                                    ->label('Question')
                                    ->required()
                                    ->placeholder('Ex: Comment accéder au contenu ?'),
                                Forms\Components\Textarea::make('answer')
                                    ->label('Réponse')
                                    ->required()
                                    ->rows(2)
                                    ->placeholder('Vous recevrez un lien de téléchargement...'),
                            ])
                            ->addActionLabel('Ajouter une question')
                            ->reorderable()
                            ->collapsible()
                            ->defaultItems(0),
                    ]),

                Forms\Components\Section::make('Vidéo de présentation')
                    ->description('Ajoutez une vidéo YouTube ou Vimeo sur votre page de vente.')
                    ->collapsible()
                    ->schema([
                        Forms\Components\TextInput::make('video_url')
                            ->label('URL de la vidéo')
                            ->url()
                            ->placeholder('https://www.youtube.com/watch?v=... ou https://vimeo.com/...')
                            ->helperText('Collez un lien YouTube ou Vimeo.'),

                        Forms\Components\TextInput::make('video_title')
                            ->label('Titre marketing')
                            ->placeholder('Ex: Découvrez la formation en 2 minutes')
                            ->maxLength(255),

                        Forms\Components\Radio::make('video_position')
                            ->label('Position sur la page')
                            ->options([
                                'above_description' => 'Au-dessus de la description',
                                'below_description' => 'En-dessous de la description',
                                'below_image' => 'Juste après l\'image de couverture',
                            ])
                            ->default('below_description')
                            ->inline(),
                    ]),

                Forms\Components\Section::make('Avis clients')
                    ->description('Témoignages affichés sur la page de vente. Choisissez un style d\'affichage.')
                    ->collapsible()
                    ->schema([
                        Forms\Components\Radio::make('testimonials_style')
                            ->label('Style d\'affichage')
                            ->options([
                                'cards' => 'Cartes — Chaque avis dans sa propre carte',
                                'minimal' => 'Minimal — Avis empilés, simple et épuré',
                                'highlight' => 'Highlight — Un avis mis en avant + les autres en grille',
                            ])
                            ->default('cards')
                            ->inline(),

                        Forms\Components\Repeater::make('testimonials')
                            ->label('')
                            ->schema([
                                Forms\Components\TextInput::make('name')
                                    ->label('Nom')
                                    ->required()
                                    ->placeholder('Fatou Diallo'),
                                Forms\Components\TextInput::make('city')
                                    ->label('Ville / Pays')
                                    ->placeholder('Dakar, Sénégal'),
                                Forms\Components\Select::make('rating')
                                    ->label('Note')
                                    ->options([
                                        5 => '⭐⭐⭐⭐⭐ (5/5)',
                                        4 => '⭐⭐⭐⭐ (4/5)',
                                        3 => '⭐⭐⭐ (3/5)',
                                    ])
                                    ->default(5)
                                    ->required(),
                                Forms\Components\Textarea::make('text')
                                    ->label('Témoignage')
                                    ->required()
                                    ->rows(2)
                                    ->placeholder('Cette formation a changé ma carrière...'),
                            ])
                            ->columns(2)
                            ->addActionLabel('Ajouter un avis')
                            ->reorderable()
                            ->collapsible()
                            ->defaultItems(0),
                    ]),

                Forms\Components\Section::make('Fichiers')
                    ->schema([
                        Forms\Components\FileUpload::make('cover_image')
                            ->label('Image de couverture')
                            ->image()
                            ->disk('s3')
                            ->directory('covers')
                            ->visibility('private')
                            ->imageEditor(),

                        Forms\Components\Radio::make('delivery_type')
                            ->label('Type de livraison')
                            ->options([
                                'file' => 'Fichier uploadé (S3)',
                                'external_url' => 'Lien externe (URL)',
                            ])
                            ->default('file')
                            ->required()
                            ->live()
                            ->inline(),

                        Forms\Components\FileUpload::make('digital_file_path')
                            ->label('Fichier digital (ZIP, PDF, Vidéo...)')
                            ->disk('s3')
                            ->directory('products')
                            ->visibility('private')
                            ->acceptedFileTypes([
                                'application/pdf',
                                'application/zip',
                                'application/x-zip-compressed',
                                'video/mp4',
                                'video/quicktime',
                            ])
                            ->maxSize(512000)
                            ->helperText('Le client recevra ce fichier après paiement.')
                            ->visible(fn (Forms\Get $get) => $get('delivery_type') === 'file'),

                        Forms\Components\TextInput::make('external_url')
                            ->label('URL externe de téléchargement')
                            ->url()
                            ->placeholder('https://drive.google.com/...')
                            ->helperText('Le client sera redirigé vers ce lien après paiement.')
                            ->visible(fn (Forms\Get $get) => $get('delivery_type') === 'external_url'),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('cover_image')
                    ->label('Image')
                    ->circular()
                    ->getStateUsing(function (Product $record): ?string {
                        if (! $record->cover_image) {
                            return null;
                        }
                        return Storage::disk('s3')->temporaryUrl(
                            $record->cover_image,
                            now()->addMinutes(60)
                        );
                    }),

                Tables\Columns\TextColumn::make('name')
                    ->label('Nom')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('store.name')
                    ->label('Boutique')
                    ->sortable(),

                Tables\Columns\TextColumn::make('price')
                    ->label('Prix')
                    ->formatStateUsing(fn (int $state): string =>
                        number_format($state, 0, ',', ' ') . ' FCFA'
                    )
                    ->sortable(),

                Tables\Columns\TextColumn::make('delivery_type')
                    ->label('Livraison')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'file' => 'Fichier S3',
                        'external_url' => 'Lien externe',
                        default => $state,
                    })
                    ->color(fn (string $state): string => match ($state) {
                        'file' => 'info',
                        'external_url' => 'warning',
                        default => 'gray',
                    }),

                Tables\Columns\TextColumn::make('orders_count')
                    ->label('Ventes')
                    ->counts('orders'),

                Tables\Columns\TextColumn::make('download_clicks_count')
                    ->label('Clics DL')
                    ->counts('downloadClicks')
                    ->sortable(),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Créé le')
                    ->dateTime('d/m/Y')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('store')
                    ->relationship('store', 'name'),
            ])
            ->actions([
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
            'index' => Pages\ListProducts::route('/'),
            'create' => Pages\CreateProduct::route('/create'),
            'edit' => Pages\EditProduct::route('/{record}/edit'),
        ];
    }
}
