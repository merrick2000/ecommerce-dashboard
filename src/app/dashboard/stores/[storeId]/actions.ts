"use server"

import { prisma } from "@/lib/prisma";

export async function addProductToStoreAction(formData: FormData, storeId: string) {
  const { requireAuth } = await import('@/lib/auth');
  await requireAuth();

  const productId = formData.get("productId") as string;

  if (!productId || !storeId) return;

  await prisma.storeProduct.create({
    data: {
      storeId,
      productId,
    }
  });
}
