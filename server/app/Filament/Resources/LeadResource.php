<?php

namespace App\Filament\Resources;

use App\Filament\Resources\LeadResource\Pages;
use App\Models\Lead;
use App\Models\Order;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class LeadResource extends Resource
{
    protected static ?string $model = Lead::class;

    protected static ?string $navigationIcon = 'heroicon-o-user-group';

    protected static ?string $navigationLabel = 'Leads';

    protected static ?int $navigationSort = 5;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('customer_email')
                    ->label('Email')
                    ->disabled(),
                Forms\Components\TextInput::make('customer_name')
                    ->label('Nom')
                    ->disabled(),
                Forms\Components\TextInput::make('customer_phone')
                    ->label('Téléphone')
                    ->disabled(),
                Forms\Components\Select::make('product_id')
                    ->label('Produit')
                    ->relationship('product', 'name')
                    ->disabled(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('customer_email')
                    ->label('Email')
                    ->searchable()
                    ->copyable(),

                Tables\Columns\TextColumn::make('customer_name')
                    ->label('Nom')
                    ->searchable()
                    ->default('—'),

                Tables\Columns\TextColumn::make('customer_phone')
                    ->label('Téléphone')
                    ->default('—')
                    ->copyable(),

                Tables\Columns\TextColumn::make('product.name')
                    ->label('Produit')
                    ->limit(25),

                Tables\Columns\TextColumn::make('source')
                    ->label('Source')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'checkout' => 'info',
                        'external_link' => 'warning',
                        default => 'gray',
                    }),

                Tables\Columns\TextColumn::make('reminder_count')
                    ->label('Relances')
                    ->badge()
                    ->color(fn (int $state): string => match (true) {
                        $state === 0 => 'gray',
                        $state === 1 => 'info',
                        $state === 2 => 'warning',
                        default => 'danger',
                    })
                    ->formatStateUsing(fn (int $state): string => $state . '/3'),

                Tables\Columns\IconColumn::make('converted')
                    ->label('Converti')
                    ->getStateUsing(fn (Lead $record): bool => $record->converted_at !== null)
                    ->boolean()
                    ->trueIcon('heroicon-o-check-circle')
                    ->falseIcon('heroicon-o-x-circle')
                    ->trueColor('success')
                    ->falseColor('danger'),

                Tables\Columns\TextColumn::make('last_reminded_at')
                    ->label('Derniere relance')
                    ->dateTime('d/m H:i')
                    ->sortable()
                    ->default('—'),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Date')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('source')
                    ->options([
                        'checkout' => 'Checkout',
                        'external_link' => 'Lien externe',
                    ]),
                Tables\Filters\TernaryFilter::make('converted')
                    ->label('Converti')
                    ->queries(
                        true: fn ($query) => $query->whereNotNull('converted_at'),
                        false: fn ($query) => $query->whereNull('converted_at'),
                    ),
                Tables\Filters\TernaryFilter::make('reminded')
                    ->label('Relance')
                    ->queries(
                        true: fn ($query) => $query->where('reminder_count', '>', 0),
                        false: fn ($query) => $query->where('reminder_count', 0),
                    ),
                Tables\Filters\Filter::make('created_at')
                    ->form([
                        Forms\Components\DatePicker::make('from')->label('Du')->native(false),
                        Forms\Components\DatePicker::make('until')->label('Au')->native(false),
                    ])
                    ->query(function ($query, array $data) {
                        return $query
                            ->when($data['from'], fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
                            ->when($data['until'], fn ($q, $d) => $q->whereDate('created_at', '<=', $d));
                    }),
            ])
            ->actions([
                Tables\Actions\Action::make('timeline')
                    ->label('Details')
                    ->icon('heroicon-o-clock')
                    ->color('info')
                    ->modalHeading(fn (Lead $record) => 'Parcours — ' . $record->customer_email)
                    ->modalContent(function (Lead $record): \Illuminate\Support\HtmlString {
                        $events = [];

                        $events[] = [
                            'date' => $record->created_at,
                            'emoji' => '👤',
                            'color' => 'blue',
                            'label' => 'Lead capture',
                            'detail' => 'Email saisi sur ' . ($record->product?->name ?? 'produit'),
                        ];

                        foreach ($record->reminder_history ?? [] as $reminder) {
                            $typeLabels = [
                                'forgot_something' => 'Relance 1 — Vous avez oublie quelque chose',
                                'cart_waiting_promo' => 'Relance 2 — Votre panier vous attend + promo',
                                'last_chance' => 'Relance 3 — Derniere chance',
                            ];
                            $events[] = [
                                'date' => \Carbon\Carbon::parse($reminder['sent_at']),
                                'emoji' => '📧',
                                'color' => 'amber',
                                'label' => $typeLabels[$reminder['type']] ?? 'Relance ' . $reminder['number'],
                                'detail' => 'Email envoye',
                            ];
                        }

                        if ($record->converted_at) {
                            $events[] = [
                                'date' => $record->converted_at,
                                'emoji' => '✅',
                                'color' => 'green',
                                'label' => 'Converti !',
                                'detail' => 'Commande payee',
                            ];
                        } elseif ($record->reminder_count >= 3) {
                            $events[] = [
                                'date' => $record->last_reminded_at ?? now(),
                                'emoji' => '❌',
                                'color' => 'red',
                                'label' => 'Non converti',
                                'detail' => 'Max relances atteint (3/3)',
                            ];
                        }

                        $html = '<div style="display:flex;flex-direction:column;gap:16px;padding:8px 0;">';
                        foreach ($events as $i => $event) {
                            $bgColor = match ($event['color']) {
                                'green' => '#dcfce7',
                                'amber' => '#fef3c7',
                                'red' => '#fee2e2',
                                default => '#dbeafe',
                            };
                            $html .= '<div style="display:flex;gap:12px;align-items:flex-start;">';
                            $html .= '<div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;background:' . $bgColor . ';flex-shrink:0;">' . $event['emoji'] . '</div>';
                            $html .= '<div style="flex:1;">';
                            $html .= '<div style="font-size:14px;font-weight:600;color:#111827;">' . e($event['label']) . '</div>';
                            $html .= '<div style="font-size:12px;color:#6b7280;">' . e($event['detail']) . '</div>';
                            $html .= '<div style="font-size:11px;color:#9ca3af;margin-top:2px;">' . $event['date']->format('d/m/Y H:i') . '</div>';
                            $html .= '</div>';
                            $html .= '</div>';
                        }
                        $html .= '</div>';

                        return new \Illuminate\Support\HtmlString($html);
                    })
                    ->modalSubmitAction(false)
                    ->modalCancelActionLabel('Fermer'),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\DeleteBulkAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ManageLeads::route('/'),
        ];
    }
}
