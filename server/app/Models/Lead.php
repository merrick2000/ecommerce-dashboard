<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lead extends Model
{
    protected $fillable = [
        'store_id',
        'product_id',
        'customer_email',
        'customer_name',
        'customer_phone',
        'source',
        'reminded_at',
    ];

    protected function casts(): array
    {
        return [
            'reminded_at' => 'datetime',
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
