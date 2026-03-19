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
        'price',
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
    ];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'features' => 'array',
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
