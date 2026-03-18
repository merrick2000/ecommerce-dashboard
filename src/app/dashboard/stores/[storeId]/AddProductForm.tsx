"use client"
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { addProductToStoreAction } from "./actions";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function AddProductForm({
  storeId,
  availableProducts
}: {
  storeId: string;
  availableProducts: any[]
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleAdd(formData: FormData) {
    startTransition(async () => {
      await addProductToStoreAction(formData, storeId);
      router.refresh();
    });
  }

  if (availableProducts.length === 0) {
    return (
      <div className="text-center p-4 border border-dashed rounded-lg text-muted-foreground">
        No more products available to add.<br/>
        Go to Products to create more!
      </div>
    );
  }

  return (
    <form action={handleAdd} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="productId">Select Product</Label>
        <select
          name="productId"
          id="productId"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
        >
          <option value="">-- Choose a product --</option>
          {availableProducts.map(product => (
            <option key={product.id} value={product.id}>
              {product.name} - ${product.price.toFixed(2)}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Adding..." : "Add to Store"}
      </Button>
    </form>
  );
}
