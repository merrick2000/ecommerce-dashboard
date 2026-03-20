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
    ];

    public const DEFAULT_PAGE_LAYOUT = [
        ['key' => 'hero_image', 'label' => 'Image de couverture', 'visible' => true],
        ['key' => 'product_name', 'label' => 'Nom du produit', 'visible' => true],
        ['key' => 'video', 'label' => 'Vidéo', 'visible' => true],
        ['key' => 'description', 'label' => 'Description', 'visible' => true],
        ['key' => 'features', 'label' => 'Avantages', 'visible' => true],
        ['key' => 'trust_badges', 'label' => 'Badges de confiance', 'visible' => true],
        ['key' => 'guarantee', 'label' => 'Garantie', 'visible' => true],
        ['key' => 'testimonials', 'label' => 'Avis clients', 'visible' => true],
        ['key' => 'faq', 'label' => 'FAQ', 'visible' => true],
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
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
