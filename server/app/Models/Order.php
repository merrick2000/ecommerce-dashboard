<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Order extends Model
{
    protected $fillable = [
        'order_number',
        'store_id',
        'product_id',
        'customer_email',
        'customer_name',
        'customer_phone',
        'amount',
        'currency',
        'status',
        'payment_method',
        'payment_ref',
        'source',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'status' => OrderStatus::class,
            'metadata' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Order $order) {
            if (! $order->order_number) {
                $order->order_number = self::generateOrderNumber();
            }
        });
    }

    public static function generateOrderNumber(): string
    {
        do {
            $number = 'SLT-' . strtoupper(Str::random(8));
        } while (self::where('order_number', $number)->exists());

        return $number;
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function paymentTransactions(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class);
    }

    public function getFormattedAmountAttribute(): string
    {
        return number_format($this->amount, 0, ',', ' ') . ' ' . $this->currency;
    }
}
