import { fetchOrder } from "@/lib/api";
import { notFound } from "next/navigation";
import { SuccessContent } from "./SuccessContent";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ order?: string; event_id?: string }>;
}) {
  const { slug } = await params;
  const { order: orderId, event_id: eventId } = await searchParams;

  if (!orderId) {
    notFound();
  }

  let data;
  try {
    data = await fetchOrder(Number(orderId));
  } catch {
    notFound();
  }

  // Vérifier que la commande correspond bien à cette boutique
  if (data.store.slug !== slug) {
    notFound();
  }

  return <SuccessContent data={data} eventId={eventId} />;
}
