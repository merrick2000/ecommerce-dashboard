import { fetchCheckoutData } from "@/lib/api";
import { CheckoutSwitcher } from "@/components/checkout/CheckoutSwitcher";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProductCheckoutPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}) {
  const { slug, productId } = await params;

  const id = parseInt(productId, 10);
  if (isNaN(id)) notFound();

  let data;
  try {
    data = await fetchCheckoutData(slug, id);
  } catch {
    notFound();
  }

  return <CheckoutSwitcher data={data} />;
}
