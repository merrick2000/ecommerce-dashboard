'use client';

import { ProductData, CurrencyPrice } from '@/lib/api';
import { t, type Locale } from '@/lib/i18n';

interface PriceDisplayProps {
  product: ProductData | (ProductData & { currency_prices?: CurrencyPrice[] });
  size?: 'sm' | 'md' | 'lg';
  primaryColor?: string;
  currency?: string;
  locale?: Locale;
}

function AltCurrencies({ prices, hasPromo, size }: { prices: CurrencyPrice[]; hasPromo: boolean; size: 'sm' | 'md' | 'lg' }) {
  if (!prices || prices.length === 0) return null;

  const altSize = { sm: 'text-xs', md: 'text-sm', lg: 'text-sm' };

  return (
    <div className={`flex flex-wrap gap-x-2 gap-y-0.5 ${altSize[size]} text-gray-400`}>
      {prices.map((cp) => (
        <span key={cp.currency}>
          {hasPromo && cp.effective_price !== cp.price ? (
            <>
              <span className="font-semibold text-gray-600">{cp.formatted_effective_price}</span>
              {' '}
              <span className="line-through text-gray-300">{cp.formatted_price}</span>
            </>
          ) : (
            <span className="font-semibold text-gray-600">{cp.formatted_price}</span>
          )}
        </span>
      ))}
    </div>
  );
}

export default function PriceDisplay({ product, size = 'md', primaryColor = '#E67E22', currency = 'FCFA', locale = 'fr' }: PriceDisplayProps) {
  const sizeClasses = {
    sm: { price: 'text-lg', original: 'text-sm', badge: 'text-xs px-2 py-0.5' },
    md: { price: 'text-2xl', original: 'text-base', badge: 'text-xs px-2 py-1' },
    lg: { price: 'text-3xl', original: 'text-lg', badge: 'text-sm px-3 py-1' },
  };

  const s = sizeClasses[size];
  const altPrices = ('currency_prices' in product ? product.currency_prices : []) || [];

  if (!product.has_promo) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className={`${s.price} font-bold`}>{product.formatted_price}</span>
        <AltCurrencies prices={altPrices} hasPromo={false} size={size} />
      </div>
    );
  }

  const style = product.promo_display_style || 'strikethrough';

  const badgeText = (() => {
    if (product.promo_type === 'percentage') {
      return `-${product.promo_percent ?? product.promo_value}%`;
    }
    // Promo fixe : afficher le montant dans la devise courante
    if (product.promo_discount != null) {
      return `-${product.promo_discount.toLocaleString()} ${currency}`;
    }
    return `-${product.promo_value?.toLocaleString()} ${currency}`;
  })();

  const discountBadge = (
    <span
      className={`${s.badge} rounded-full font-semibold text-white`}
      style={{ backgroundColor: primaryColor }}
    >
      {badgeText}
    </span>
  );

  const labelText = product.promo_label && (
    <span className="text-xs font-medium italic text-gray-500">
      {product.promo_label}
    </span>
  );

  // Style 1: Prix barré uniquement
  if (style === 'strikethrough') {
    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`${s.price} font-bold`} style={{ color: primaryColor }}>
            {product.formatted_effective_price}
          </span>
          <span className={`${s.original} line-through text-gray-400`}>
            {product.formatted_price}
          </span>
          {discountBadge}
          {labelText}
        </div>
        <AltCurrencies prices={altPrices} hasPromo={true} size={size} />
      </div>
    );
  }

  // Style 2: Prix barré + "au lieu de"
  if (style === 'strikethrough_text') {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`${s.price} font-bold`} style={{ color: primaryColor }}>
            {product.formatted_effective_price}
          </span>
          {discountBadge}
        </div>
        <span className={`${s.original} text-gray-400`}>
          {t('price.instead_of', locale)} <span className="line-through">{product.formatted_price}</span>
        </span>
        {labelText}
        <AltCurrencies prices={altPrices} hasPromo={true} size={size} />
      </div>
    );
  }

  // Style 3: Texte marketing uniquement (badge + label, pas de barré)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`${s.price} font-bold`} style={{ color: primaryColor }}>
          {product.formatted_effective_price}
        </span>
        {discountBadge}
      </div>
      {labelText}
      <AltCurrencies prices={altPrices} hasPromo={true} size={size} />
    </div>
  );
}
