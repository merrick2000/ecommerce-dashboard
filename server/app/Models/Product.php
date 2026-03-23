<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Product extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $fillable = [
        'store_id',
        'name',
        'description',
        'description_ctas',
        'price',
        'promo_type',
        'promo_value',
        'promo_label',
        'promo_display_style',
        'features',
        'features_position',
        'faqs',
        'testimonials',
        'testimonials_style',
        'video_url',
        'video_title',
        'video_position',
        'digital_file_path',
        'cover_image',
        'delivery_type',
        'external_url',
        'payment_mode',
        'payment_link',
        'external_platform',
        'external_product_id',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'features' => 'array',
            'description_ctas' => 'array',
            'faqs' => 'array',
            'testimonials' => 'array',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function downloadClicks(): HasMany
    {
        return $this->hasMany(DownloadClick::class);
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('digital_files')
            ->singleFile()
            ->useDisk('s3');

        $this->addMediaCollection('cover_images')
            ->singleFile()
            ->useDisk('s3');
    }

    public function getFormattedPriceAttribute(): string
    {
        return number_format($this->price, 0, ',', ' ') . ' FCFA';
    }

    /**
     * Calcule le prix final après promo.
     */
    public function getEffectivePriceAttribute(): int
    {
        if ($this->promo_type === 'percentage' && $this->promo_value > 0) {
            return (int) round($this->price * (1 - $this->promo_value / 100));
        }

        if ($this->promo_type === 'fixed' && $this->promo_value > 0) {
            return max(0, $this->price - $this->promo_value);
        }

        return $this->price;
    }

    public function hasPromo(): bool
    {
        return $this->promo_type !== 'none'
            && $this->promo_type !== null
            && $this->promo_value > 0;
    }

    /**
     * Retourne l'URL de téléchargement (S3 temporaire ou lien externe).
     */
    public function getDownloadUrl(int $expirationMinutes = 30): ?string
    {
        if ($this->delivery_type === 'external_url' && $this->external_url) {
            return $this->external_url;
        }

        if ($this->digital_file_path) {
            return Storage::disk('s3')->temporaryUrl(
                $this->digital_file_path,
                now()->addMinutes($expirationMinutes)
            );
        }

        return null;
    }
}
