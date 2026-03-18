import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AddProductForm } from "./AddProductForm"; // We'll create this component next

export default async function ManageStorePage({ params }: { params: Promise<{ storeId: string }> }) {
  const storeId = (await params).storeId;

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: {
      products: {
        include: { product: true }
      }
    }
  });

  if (!store) redirect("/dashboard/stores");

  // Fetch all available products not already in the store
  const availableProducts = await prisma.product.findMany({
    where: {
      NOT: {
        stores: {
          some: { storeId: storeId }
        }
      }
    }
  });

  async function removeProduct(formData: FormData) {
    "use server"
    const { requireAuth } = await import('@/lib/auth');
    await requireAuth();

    const productId = formData.get("productId") as string;
    await prisma.storeProduct.delete({
      where: {
        storeId_productId: {
          storeId,
          productId
        }
      }
    });
    // This server action will naturally trigger a re-render in next.js app router
    // when using revalidatePath (which we should technically do, but for simplicity we rely on refresh)
    redirect(`/dashboard/stores/${storeId}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/stores">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{store.name}</h1>
          <p className="text-muted-foreground">{store.description}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Products in Store</CardTitle>
            <CardDescription>Digital products assigned to this store.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                      No products in this store yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  store.products.map(({ product }) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>${product.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <form action={removeProduct}>
                           <input type="hidden" name="productId" value={product.id} />
                           <Button type="submit" variant="destructive" size="sm" title="Remove from store">
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Product to Store</CardTitle>
            <CardDescription>Select an existing product to sell in this store.</CardDescription>
          </CardHeader>
          <CardContent>
             <AddProductForm storeId={storeId} availableProducts={availableProducts} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
