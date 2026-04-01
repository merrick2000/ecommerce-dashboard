import { fetchCheckoutData } from "@/lib/api";
import { CheckoutSwitcher } from "@/components/checkout/CheckoutSwitcher";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const revalidate = 60; // Revalide toutes les 60 secondes

type Props = {
  params: Promise<{ slug: string; productId: string }>;
  searchParams: Promise<{ promo?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, productId } = await params;
  const id = parseInt(productId, 10);
  if (isNaN(id)) return {};

  try {
    const data = await fetchCheckoutData(slug, id);
    return {
      title: `${data.product.name} — ${data.store.name}`,
      description: data.product.description
        ? data.product.description.replace(/<[^>]*>/g, "").slice(0, 160)
        : `Achetez ${data.product.name} sur ${data.store.name}`,
      openGraph: {
        title: data.product.name,
        description: data.product.description
          ? data.product.description.replace(/<[^>]*>/g, "").slice(0, 160)
          : undefined,
        images: data.product.cover_image ? [data.product.cover_image] : undefined,
      },
    };
  } catch {
    return {};
  }
}

export default async function ProductCheckoutPage({ params, searchParams }: Props) {
  const { slug, productId } = await params;
  const { promo } = await searchParams;

  const id = parseInt(productId, 10);
  if (isNaN(id)) notFound();

  let data;
  try {
    data = await fetchCheckoutData(slug, id);
  } catch {
    notFound();
  }

  return <CheckoutSwitcher data={data} promoCode={promo} />;
}
