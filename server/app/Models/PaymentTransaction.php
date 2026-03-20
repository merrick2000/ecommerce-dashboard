<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentTransaction extends Model
{
    protected $fillable = [
        'order_id',
        'provider',
        'provider_ref',
        'country',
        'network',
        'phone',
        'status',
        'amount',
        'currency',
        'provider_response',
        'webhook_payload',
        'error_message',
        'attempt_number',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'attempt_number' => 'integer',
            'provider_response' => 'array',
            'webhook_payload' => 'array',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
