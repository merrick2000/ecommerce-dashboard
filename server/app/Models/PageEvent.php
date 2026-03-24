<?php

namespace App\Models;

use App\Enums\PageEventType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PageEvent extends Model
{
    const UPDATED_AT = null;

    protected $fillable = [
        'store_id',
        'product_id',
        'event_type',
        'session_id',
        'ip_hash',
        'referrer',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'device_type',
        'country',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'event_type' => PageEventType::class,
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
