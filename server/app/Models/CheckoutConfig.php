<?php

namespace App\Models;

use App\Enums\TemplateType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CheckoutConfig extends Model
{
    protected $fillable = [
        'store_id',
        'template_type',
        'primary_color',
        'cta_text',
        'show_urgency_timer',
        'trust_badges',
        'urgency_config',
        'sales_popup',
        'payment_logos',
        'tracking_config',
        'page_layout',
        'abandoned_cart_promo',
    ];

    public const DEFAULT_PAGE_LAYOUT = [
        ['key' => 'hero_image', 'label' => 'Image de couverture', 'icon' => 'photo', 'visible' => true],
        ['key' => 'product_name', 'label' => 'Nom du produit', 'icon' => 'tag', 'visible' => true],
        ['key' => 'price_cta', 'label' => 'Prix & bouton achat (mobile)', 'icon' => 'currency-dollar', 'visible' => true],
        ['key' => 'video', 'label' => 'Vidéo', 'icon' => 'play-circle', 'visible' => true],
        ['key' => 'custom_text', 'label' => 'Bloc texte libre', 'icon' => 'pencil-square', 'visible' => false],
        ['key' => 'description', 'label' => 'Description', 'icon' => 'document-text', 'visible' => true],
        ['key' => 'features', 'label' => 'Avantages', 'icon' => 'check-badge', 'visible' => true],
        ['key' => 'trust_badges', 'label' => 'Badges de confiance', 'icon' => 'shield-check', 'visible' => true],
        ['key' => 'guarantee', 'label' => 'Garantie', 'icon' => 'hand-thumb-up', 'visible' => true],
        ['key' => 'testimonials', 'label' => 'Avis clients', 'icon' => 'chat-bubble-left-right', 'visible' => true],
        ['key' => 'faq', 'label' => 'FAQ', 'icon' => 'question-mark-circle', 'visible' => true],
    ];

    protected function casts(): array
    {
        return [
            'template_type' => TemplateType::class,
            'show_urgency_timer' => 'boolean',
            'trust_badges' => 'array',
            'urgency_config' => 'array',
            'sales_popup' => 'array',
            'payment_logos' => 'array',
            'tracking_config' => 'array',
            'page_layout' => 'array',
            'abandoned_cart_promo' => 'array',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
