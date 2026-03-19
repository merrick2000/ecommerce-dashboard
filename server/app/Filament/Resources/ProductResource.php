<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ProductResource\Pages;
use App\Models\Product;
use FilamentTiptapEditor\TiptapEditor;
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
                Forms\Components\Section::make()
                    ->schema([
                        Forms\Components\Grid::make(3)
                            ->schema([
                                Forms\Components\Select::make('store_id')
                                    ->label('Boutique')
                                    ->relationship('store', 'name')
                                    ->required()
                                    ->searchable()
                                    ->preload(),

                                Forms\Components\TextInput::make('price')
                                    ->label('Prix original (FCFA)')
                                    ->required()
                                    ->numeric()
                                    ->minValue(0)
                                    ->suffix('FCFA')
                                    ->placeholder('5000')
                                    ->live(onBlur: true),

                                Forms\Components\Placeholder::make('effective_price_display')
                                    ->label('Prix final')
                                    ->content(function (Forms\Get $get): string {
                                        $price = (int) ($get('price') ?? 0);
                                        $type = $get('promo_type') ?? 'none';
                                        $value = (int) ($get('promo_value') ?? 0);

                                        if ($type === 'percentage' && $value > 0) {
                                            $final = (int) round($price * (1 - $value / 100));
                                        } elseif ($type === 'fixed' && $value > 0) {
                                            $final = max(0, $price - $value);
                                        } else {
                                            return number_format($price) . ' FCFA';
                                        }

                                        return number_format($final) . ' FCFA (au lieu de ' . number_format($price) . ')';
                                    }),
                            ]),

                        Forms\Components\TextInput::make('name')
                            ->label('Nom du produit')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('Ex: Formation React Avancé'),

                        Forms\Components\Grid::make(3)
                            ->schema([
                                Forms\Components\Select::make('promo_type')
                                    ->label('Promotion')
                                    ->options([
                                        'none' => 'Aucune',
                                        'percentage' => 'Réduction en %',
                                        'fixed' => 'Réduction fixe (FCFA)',
                                    ])
                                    ->default('none')
                                    ->live(),

                                Forms\Components\TextInput::make('promo_value')
                                    ->label(fn (Forms\Get $get) => $get('promo_type') === 'percentage' ? 'Réduction (%)' : 'Réduction (FCFA)')
                                    ->numeric()
                                    ->minValue(1)
                                    ->maxValue(fn (Forms\Get $get) => $get('promo_type') === 'percentage' ? 99 : null)
                                    ->suffix(fn (Forms\Get $get) => $get('promo_type') === 'percentage' ? '%' : 'FCFA')
                                    ->placeholder(fn (Forms\Get $get) => $get('promo_type') === 'percentage' ? '30' : '2000')
                                    ->visible(fn (Forms\Get $get) => $get('promo_type') !== 'none')
                                    ->live(onBlur: true),

                                Forms\Components\TextInput::make('promo_label')
                                    ->label('Texte marketing (optionnel)')
                                    ->placeholder('Ex: Offre de lancement, -30% cette semaine')
                                    ->maxLength(100)
                                    ->visible(fn (Forms\Get $get) => $get('promo_type') !== 'none'),
                            ]),

                        Forms\Components\Radio::make('promo_display_style')
                            ->label('Affichage du prix promo')
                            ->options([
                                'strikethrough' => 'Prix barré uniquement (15 000 → 10 000)',
                                'strikethrough_text' => 'Prix barré + "au lieu de" (10 000 au lieu de 15 000)',
                                'text_only' => 'Texte marketing uniquement (badge + label)',
                            ])
                            ->default('strikethrough')
                            ->inline()
                            ->visible(fn (Forms\Get $get) => $get('promo_type') !== 'none'),
                    ]),

                Forms\Components\Tabs::make('Produit')
                    ->tabs([
                        // ─── TAB 1 : DESCRIPTION ────────────────────────
                        Forms\Components\Tabs\Tab::make('Description')
                            ->icon('heroicon-o-document-text')
                            ->schema([
                                TiptapEditor::make('description')
                                    ->label('Description (page de vente)')
                                    ->profile('sales_page')
                                    ->output(\FilamentTiptapEditor\Enums\TiptapOutput::Html)
                                    ->placeholder('Décrivez ce que le client va recevoir...')
                                    ->helperText('Astuce : les boutons CTA ci-dessous seront insérés après le paragraphe indiqué.')
                                    ->columnSpanFull(),

                                Forms\Components\Repeater::make('description_ctas')
                                    ->label('Boutons CTA dans la description')
                                    ->schema([
                                        Forms\Components\Grid::make(3)
                                            ->schema([
                                                Forms\Components\TextInput::make('text')
                                                    ->label('Texte du bouton')
                                                    ->required()
                                                    ->placeholder('Ex: Acheter maintenant')
                                                    ->default('Acheter maintenant'),

                                                Forms\Components\Select::make('action')
                                                    ->label('Action')
                                                    ->options([
                                                        'scroll_to_form' => 'Scroller vers le formulaire',
                                                        'custom_url' => 'Lien personnalisé',
                                                    ])
                                                    ->default('scroll_to_form')
                                                    ->required()
                                                    ->live(),

                                                Forms\Components\TextInput::make('url')
                                                    ->label('URL')
                                                    ->url()
                                                    ->placeholder('https://...')
                                                    ->visible(fn (Forms\Get $get) => $get('action') === 'custom_url'),
                                            ]),

                                        Forms\Components\Grid::make(2)
                                            ->schema([
                                                Forms\Components\Select::make('alignment')
                                                    ->label('Alignement')
                                                    ->options([
                                                        'left' => 'Gauche',
                                                        'center' => 'Centré',
                                                    ])
                                                    ->default('center')
                                                    ->required(),

                                                Forms\Components\TextInput::make('after_paragraph')
                                                    ->label('Après le paragraphe n°')
                                                    ->numeric()
                                                    ->minValue(0)
                                                    ->default(1)
                                                    ->required()
                                                    ->helperText('0 = tout en haut, 1 = après le 1er paragraphe, etc.'),
                                            ]),
                                    ])
                                    ->addActionLabel('Ajouter un bouton CTA')
                                    ->reorderable()
                                    ->collapsible()
                                    ->defaultItems(0)
                                    ->itemLabel(fn (array $state): ?string => ($state['text'] ?? 'CTA') . ' — après §' . ($state['after_paragraph'] ?? '?')),

                                Forms\Components\Radio::make('features_position')
                                    ->label('Position des avantages')
                                    ->options([
                                        'above_description' => 'Au-dessus de la description',
                                        'below_description' => 'En-dessous de la description',
                                        'above_form' => 'Au-dessus du formulaire',
                                    ])
                                    ->default('below_description')
                                    ->inline(),

                                Forms\Components\Repeater::make('features')
                                    ->label('Ce que vous obtenez')
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

                        // ─── TAB 2 : MÉDIAS ─────────────────────────────
                        Forms\Components\Tabs\Tab::make('Médias & Fichiers')
                            ->icon('heroicon-o-photo')
                            ->schema([
                                Forms\Components\FileUpload::make('cover_image')
                                    ->label('Image de couverture')
                                    ->image()
                                    ->disk('s3')
                                    ->directory('covers')
                                    ->visibility('private')
                                    ->imageEditor(),

                                Forms\Components\Grid::make(2)
                                    ->schema([
                                        Forms\Components\TextInput::make('video_url')
                                            ->label('URL vidéo (YouTube / Vimeo)')
                                            ->url()
                                            ->placeholder('https://www.youtube.com/watch?v=...'),

                                        Forms\Components\TextInput::make('video_title')
                                            ->label('Titre de la vidéo')
                                            ->placeholder('Découvrez la formation en 2 min')
                                            ->maxLength(255),
                                    ]),

                                Forms\Components\Radio::make('video_position')
                                    ->label('Position de la vidéo')
                                    ->options([
                                        'above_description' => 'Au-dessus de la description',
                                        'below_description' => 'En-dessous de la description',
                                        'below_image' => 'Après l\'image de couverture',
                                    ])
                                    ->default('below_description')
                                    ->inline(),

                                Forms\Components\Section::make('Livraison du produit')
                                    ->schema([
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
                            ]),

                        // ─── TAB 3 : SOCIAL PROOF ───────────────────────
                        Forms\Components\Tabs\Tab::make('Avis & FAQ')
                            ->icon('heroicon-o-chat-bubble-left-right')
                            ->schema([
                                Forms\Components\Section::make('Avis clients')
                                    ->schema([
                                        Forms\Components\Radio::make('testimonials_style')
                                            ->label('Style d\'affichage')
                                            ->options([
                                                'cards' => 'Cartes',
                                                'minimal' => 'Minimal',
                                                'highlight' => 'Highlight',
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
                                                        5 => '5/5',
                                                        4 => '4/5',
                                                        3 => '3/5',
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

                                Forms\Components\Section::make('FAQ')
                                    ->schema([
                                        Forms\Components\Repeater::make('faqs')
                                            ->label('')
                                            ->schema([
                                                Forms\Components\TextInput::make('question')
                                                    ->label('Question')
                                                    ->required()
                                                    ->placeholder('Comment accéder au contenu ?'),
                                                Forms\Components\Textarea::make('answer')
                                                    ->label('Réponse')
                                                    ->required()
                                                    ->rows(2)
                                                    ->placeholder('Vous recevrez un lien...'),
                                            ])
                                            ->addActionLabel('Ajouter une question')
                                            ->reorderable()
                                            ->collapsible()
                                            ->defaultItems(0),
                                    ]),
                            ]),
                    ])
                    ->columnSpanFull()
                    ->persistTabInQueryString(),
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
                Tables\Actions\ReplicateAction::make()
                    ->label('Dupliquer')
                    ->icon('heroicon-o-document-duplicate')
                    ->color('gray')
                    ->excludeAttributes(['cover_image', 'digital_file_path', 'orders_count', 'download_clicks_count'])
                    ->beforeReplicaSaved(function (Product $replica): void {
                        $replica->name = $replica->name . ' (copie)';
                    }),
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
