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
        'reminder_count',
        'converted_at',
        'last_reminded_at',
        'reminder_history',
    ];

    protected function casts(): array
    {
        return [
            'reminded_at' => 'datetime',
            'converted_at' => 'datetime',
            'last_reminded_at' => 'datetime',
            'reminder_history' => 'array',
        ];
    }

    public function addReminderToHistory(int $reminderNumber, string $emailType): void
    {
        $history = $this->reminder_history ?? [];
        $history[] = [
            'number' => $reminderNumber,
            'type' => $emailType,
            'sent_at' => now()->toIso8601String(),
        ];
        $this->reminder_history = $history;
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
