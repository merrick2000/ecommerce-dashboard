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
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
