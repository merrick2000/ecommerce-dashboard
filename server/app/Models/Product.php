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
        'is_active',
        'description',
        'custom_text',
        'description_ctas',
        'price',
        'currency_prices',
        'base_currency',
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
        'thumbnail',
        'delivery_type',
        'external_url',
        'payment_mode',
        'payment_link',
        'external_platform',
        'external_product_id',
        'chariow_product_id',
        'maketou_product_id',
        'whatsapp_chat',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'float',
            'promo_value' => 'float',
            'is_active' => 'boolean',
            'currency_prices' => 'array',
            'whatsapp_chat' => 'array',
            'features' => 'array',
            'description_ctas' => 'array',
            'faqs' => 'array',
            'testimonials' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Product $product) {
            if (! $product->base_currency) {
                $product->base_currency = $product->store?->currency ?? 'XOF';
            }
        });
    }

    /**
     * Résout le prix principal et les prix alternatifs en fonction de la devise de la boutique.
     *
     * Si la boutique a changé de devise et qu'un prix existe pour cette devise,
     * il devient le prix principal. L'ancien prix de base rejoint les prix alternatifs.
     */
    public function resolveDisplayPrice(string $storeCurrency): array
    {
        $basePrice = $this->price;
        $currencyPrices = $this->currency_prices ?? [];

        // Déterminer la devise d'origine du prix de base
        // Si base_currency n'est pas set, on le déduit : si un prix existe pour
        // la devise actuelle de la boutique dans currency_prices, alors le prix de base
        // est forcément dans une AUTRE devise (l'ancienne devise boutique).
        // Sinon, le prix de base est dans la devise actuelle de la boutique.
        $baseCurrency = $this->base_currency;

        if (! $baseCurrency) {
            $hasStoreCurrencyInAlt = false;
            foreach ($currencyPrices as $entry) {
                if (($entry['currency'] ?? '') === $storeCurrency) {
                    $hasStoreCurrencyInAlt = true;
                    break;
                }
            }
            // Si la devise boutique est dans les alt, le prix de base n'est PAS dans cette devise
            // On ne sait pas exactement laquelle c'est, mais on sait que c'est != storeCurrency
            // ce qui suffit pour déclencher le swap
            $baseCurrency = $hasStoreCurrencyInAlt ? '__original__' : $storeCurrency;
        }

        // Chercher un prix correspondant à la devise de la boutique
        $matchIndex = null;
        foreach ($currencyPrices as $i => $entry) {
            if (($entry['currency'] ?? '') === $storeCurrency) {
                $matchIndex = $i;
                break;
            }
        }

        if ($matchIndex !== null && $storeCurrency !== $baseCurrency) {
            // Swap: le prix de la devise boutique devient le prix principal
            $mainPrice = (float) $currencyPrices[$matchIndex]['price'];
            $mainCurrency = $storeCurrency;

            // Construire les prix alternatifs (autres devises)
            $altPrices = [];
            // Ajouter le prix de base en alt seulement si on connaît sa devise
            if ($baseCurrency !== '__original__') {
                $altPrices[] = ['currency' => $baseCurrency, 'price' => $basePrice];
            }
            foreach ($currencyPrices as $i => $entry) {
                if ($i !== $matchIndex) {
                    $altPrices[] = $entry;
                }
            }
        } else {
            // Pas de swap, garder le prix de base
            $mainPrice = $basePrice;
            $mainCurrency = ($baseCurrency === '__original__') ? $storeCurrency : $baseCurrency;
            $altPrices = $currencyPrices;
        }

        // Calculer les prix effectifs (promo)
        $mainEffective = $this->applyPromo($mainPrice, $mainCurrency);
        $formattedAlt = array_map(function ($entry) {
            $price = (float) ($entry['price'] ?? 0);
            $currency = $entry['currency'] ?? '';
            $effective = $this->applyPromo($price, $currency);
            $dec = fn ($v) => floor($v) == $v ? 0 : 2;

            return [
                'currency' => $currency,
                'price' => $price,
                'formatted_price' => number_format($price, $dec($price), '.', ' ') . ' ' . $currency,
                'effective_price' => $effective,
                'formatted_effective_price' => number_format($effective, $dec($effective), '.', ' ') . ' ' . $currency,
            ];
        }, $altPrices);

        // Calcul des infos promo pour le badge
        $promoPercent = null;
        $promoDiscount = null;
        if ($this->hasPromo() && $mainPrice > 0) {
            $promoPercent = (int) round((1 - $mainEffective / $mainPrice) * 100);
            $promoDiscount = $mainPrice - $mainEffective;
        }

        $decimals = fn ($v) => floor($v) == $v ? 0 : 2;

        return [
            'price' => $mainPrice,
            'currency' => $mainCurrency,
            'formatted_price' => number_format($mainPrice, $decimals($mainPrice), '.', ' ') . ' ' . $mainCurrency,
            'effective_price' => $mainEffective,
            'formatted_effective_price' => number_format($mainEffective, $decimals($mainEffective), '.', ' ') . ' ' . $mainCurrency,
            'promo_percent' => $promoPercent,
            'promo_discount' => $promoDiscount,
            'currency_prices' => $formattedAlt,
        ];
    }

    private function applyPromo(float $price, string $currency): float
    {
        if ($this->promo_type === 'percentage' && $this->promo_value > 0) {
            return round($price * (1 - $this->promo_value / 100), 2);
        }

        if ($this->promo_type === 'fixed' && $this->promo_value > 0 && $this->price > 0) {
            $discountRatio = $this->promo_value / $this->price;

            return max(0, round($price * (1 - $discountRatio), 2));
        }

        return $price;
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

    public function pageEvents(): HasMany
    {
        return $this->hasMany(PageEvent::class);
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
