import { fetchCheckoutData, fetchPaymentCountries } from "@/lib/api";
import { notFound } from "next/navigation";
import { PaymentPage } from "@/components/payment/PaymentPage";

export const dynamic = "force-dynamic";

export default async function PayPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; productId: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { slug, productId } = await params;
  const { order: orderId } = await searchParams;

  const id = parseInt(productId, 10);
  const oid = orderId ? parseInt(orderId, 10) : null;

  if (isNaN(id) || !oid || isNaN(oid)) notFound();

  let data;
  let countries;

  try {
    [data, countries] = await Promise.all([
      fetchCheckoutData(slug, id),
      fetchPaymentCountries(),
    ]);
  } catch {
    notFound();
  }

  return (
    <PaymentPage
      data={data}
      countries={countries.countries}
      orderId={oid}
    />
  );
}
