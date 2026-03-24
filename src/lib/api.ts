const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface StoreData {
  id: number;
  name: string;
  slug: string;
  currency: string;
  locale?: 'fr' | 'en';
}

export interface ProductData {
  id: number;
  name: string;
  description: string | null;
  price: number;
  formatted_price: string;
  effective_price: number;
  formatted_effective_price: string;
  has_promo: boolean;
  promo_type: 'none' | 'percentage' | 'fixed' | null;
  promo_value: number | null;
  promo_label: string | null;
  promo_display_style: 'strikethrough' | 'strikethrough_text' | 'text_only';
  description_ctas: {
    text: string;
    action: 'scroll_to_form' | 'custom_url';
    url?: string;
    alignment: 'left' | 'center';
    after_paragraph: number;
  }[];
  cover_image: string | null;
  features: string[];
  features_position: 'above_description' | 'below_description' | 'above_form';
  faqs: { question: string; answer: string }[];
  testimonials: { name: string; city?: string; rating: number; text: string }[];
  testimonials_style: 'cards' | 'minimal' | 'highlight';
  video_url: string | null;
  video_title: string | null;
  video_position: 'above_description' | 'below_description' | 'below_image';
  payment_mode: 'native' | 'external_link';
  payment_link: string | null;
  external_platform: 'selar' | 'chariow' | null;
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
  show_name?: boolean;
  entries?: { name: string; city: string }[];
}

export interface TrackingConfig {
  facebook_pixel_id?: string;
  tiktok_pixel_id?: string;
}

export interface PageSection {
  key: string;
  label: string;
  visible: boolean;
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
  page_layout: PageSection[];
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
    locale?: 'fr' | 'en';
  };
  download_url: string | null;
  is_external: boolean;
  tracking: TrackingConfig | null;
}

export interface StoreCatalogProduct {
  id: number;
  name: string;
  description: string | null;
  price: number;
  formatted_price: string;
  effective_price: number;
  formatted_effective_price: string;
  has_promo: boolean;
  promo_type: 'none' | 'percentage' | 'fixed' | null;
  promo_value: number | null;
  promo_label: string | null;
  promo_display_style: 'strikethrough' | 'strikethrough_text' | 'text_only';
  cover_image: string | null;
  thumbnail: string | null;
}

export interface StoreCatalogData {
  store: StoreData;
  products: StoreCatalogProduct[];
  checkout_config: {
    primary_color: string;
    template_type: string;
  };
}

export async function fetchStoreCatalog(storeSlug: string): Promise<StoreCatalogData> {
  const res = await fetch(`${API_BASE}/v1/stores/${storeSlug}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Boutique introuvable');
  }

  return res.json();
}

export async function fetchCheckoutData(storeSlug: string, productId: number): Promise<CheckoutPageData> {
  const res = await fetch(`${API_BASE}/v1/checkout/${storeSlug}/${productId}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Produit introuvable');
  }

  return res.json();
}

export async function createOrder(data: {
  store_id: number;
  product_id: number;
  customer_email: string;
  customer_name?: string;
  customer_phone?: string;
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

export function sendTrackEvent(data: {
  store_id: number;
  product_id?: number;
  event_type: string;
  session_id: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}): void {
  fetch(`${API_BASE}/v1/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    keepalive: true,
  }).catch(() => {});
}

// ─── Payment API ──────────────────────────────────────────────────────

export interface PaymentCountry {
  name: string;
  networks: Record<string, string>; // { mtn: "MTN Mobile Money", wave: "Wave", ... }
}

export interface PaymentCountriesResponse {
  countries: Record<string, PaymentCountry>; // { BJ: {...}, SN: {...}, ... }
}

export interface PaymentInitiateResponse {
  status: 'processing' | 'redirect' | 'otp_required';
  provider: string;
  redirect_url: string | null;
  order_id: number;
  message: string;
  otp_flow?: 'ussd_pre_otp';
  ussd_instruction?: string;
}

export interface PaymentStatusResponse {
  status: 'pending' | 'processing' | 'paid' | 'failed';
  order_id: number;
}

export async function fetchPaymentCountries(): Promise<PaymentCountriesResponse> {
  const res = await fetch(`${API_BASE}/v1/payments/countries`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error('Impossible de charger les pays');
  }

  return res.json();
}

export async function initiatePayment(data: {
  order_id: number;
  country: string;
  network: string;
  phone: string;
}): Promise<PaymentInitiateResponse> {
  const res = await fetch(`${API_BASE}/v1/payments/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Le paiement a échoué');
  }

  return res.json();
}

export async function confirmPaymentOtp(data: {
  order_id: number;
  otp_code: string;
}): Promise<PaymentStatusResponse> {
  const res = await fetch(`${API_BASE}/v1/payments/confirm-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Code incorrect');
  }

  return res.json();
}

export async function checkPaymentStatus(orderId: number): Promise<PaymentStatusResponse> {
  const res = await fetch(`${API_BASE}/v1/payments/${orderId}/status`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Impossible de vérifier le statut');
  }

  return res.json();
}
