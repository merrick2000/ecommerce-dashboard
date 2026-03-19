'use client';

import { ProductData } from '@/lib/api';

interface PriceDisplayProps {
  product: ProductData;
  size?: 'sm' | 'md' | 'lg';
  primaryColor?: string;
}

export default function PriceDisplay({ product, size = 'md', primaryColor = '#E67E22' }: PriceDisplayProps) {
  const sizeClasses = {
    sm: { price: 'text-lg', original: 'text-sm', badge: 'text-xs px-2 py-0.5' },
    md: { price: 'text-2xl', original: 'text-base', badge: 'text-xs px-2 py-1' },
    lg: { price: 'text-3xl', original: 'text-lg', badge: 'text-sm px-3 py-1' },
  };

  const s = sizeClasses[size];

  if (!product.has_promo) {
    return <span className={`${s.price} font-bold`}>{product.formatted_price}</span>;
  }

  const style = product.promo_display_style || 'strikethrough';

  const discountBadge = (
    <span
      className={`${s.badge} rounded-full font-semibold text-white`}
      style={{ backgroundColor: primaryColor }}
    >
      {product.promo_type === 'percentage'
        ? `-${product.promo_value}%`
        : `-${product.promo_value?.toLocaleString()} FCFA`}
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
          au lieu de <span className="line-through">{product.formatted_price}</span>
        </span>
        {labelText}
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
    </div>
  );
}
