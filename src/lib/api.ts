const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface StoreData {
  id: number;
  name: string;
  slug: string;
  currency: string;
}

export interface ProductData {
  id: number;
  name: string;
  description: string | null;
  price: number;
  formatted_price: string;
  cover_image: string | null;
  features: string[];
  features_position: 'above_description' | 'below_description' | 'above_form';
  faqs: { question: string; answer: string }[];
  testimonials: { name: string; city?: string; rating: number; text: string }[];
  testimonials_style: 'cards' | 'minimal' | 'highlight';
  video_url: string | null;
  video_title: string | null;
  video_position: 'above_description' | 'below_description' | 'below_image';
}

export interface UrgencyConfig {
  countdown_timer?: { enabled: boolean; duration_minutes: number; label?: string };
  limited_spots?: { enabled: boolean; total_spots: number; remaining_spots: number };
  flash_sale?: { enabled: boolean; discount_percent: number; duration_minutes: number };
  social_proof?: { enabled: boolean; viewer_count: number };
}

export interface SalesPopupConfig {
  enabled?: boolean;
  interval_seconds?: number;
  entries?: { name: string; city: string }[];
}

export interface TrackingConfig {
  facebook_pixel_id?: string;
  tiktok_pixel_id?: string;
}

export interface CheckoutConfigData {
  template_type: 'CLASSIC' | 'DARK_PREMIUM' | 'MINIMALIST_CARD';
  primary_color: string;
  cta_text: string;
  urgency_config: UrgencyConfig;
  trust_badges: string[];
  sales_popup: SalesPopupConfig;
  payment_logos: string[];
  tracking: TrackingConfig | null;
}

export interface CheckoutPageData {
  store: StoreData;
  product: ProductData;
  checkout_config: CheckoutConfigData;
}

export interface OrderResponse {
  order: {
    id: number;
    amount: number;
    currency: string;
    status: string;
    formatted_amount: string;
  };
  event_id?: string;
  payment_url?: string;
  message: string;
}

export interface OrderDetailsResponse {
  order: {
    id: number;
    status: string;
    amount: number;
    currency: string;
    formatted_amount: string;
    customer_email: string;
    customer_name: string | null;
    created_at: string;
  };
  product: {
    id: number;
    name: string;
    description: string | null;
    cover_image: string | null;
  };
  store: {
    name: string;
    slug: string;
  };
  download_url: string | null;
  is_external: boolean;
  tracking: TrackingConfig | null;
}

export async function fetchCheckoutData(storeSlug: string): Promise<CheckoutPageData> {
  const res = await fetch(`${API_BASE}/v1/checkout/${storeSlug}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error('Boutique introuvable');
  }

  return res.json();
}

export async function createOrder(data: {
  store_id: number;
  product_id: number;
  customer_email: string;
  customer_name?: string;
  customer_phone?: string;
  payment_method?: string;
}): Promise<OrderResponse> {
  const res = await fetch(`${API_BASE}/v1/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Erreur lors de la création de la commande');
  }

  return res.json();
}

export async function fetchOrder(orderId: number): Promise<OrderDetailsResponse> {
  const res = await fetch(`${API_BASE}/v1/orders/${orderId}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Commande introuvable');
  }

  return res.json();
}

export async function trackDownload(orderId: number): Promise<void> {
  fetch(`${API_BASE}/v1/download/${orderId}/track`, { method: 'POST' }).catch(() => {});
}
