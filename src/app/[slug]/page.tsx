import { fetchCheckoutData } from "@/lib/api";
import { CheckoutSwitcher } from "@/components/checkout/CheckoutSwitcher";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let data;
  try {
    data = await fetchCheckoutData(slug);
  } catch {
    notFound();
  }

  return <CheckoutSwitcher data={data} />;
}
