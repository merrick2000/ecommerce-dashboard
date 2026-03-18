import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default function NewProductPage() {

  // Server Action to create a new product
  async function createProduct(formData: FormData) {
    "use server"

    const { requireAuth } = await import('@/lib/auth');
    await requireAuth(); // Securing the endpoint

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const fileUrl = formData.get("fileUrl") as string; // in a real world, you'd handle file upload here

    if (!name || isNaN(price)) {
      throw new Error("Invalid input");
    }

    await prisma.product.create({
      data: {
        name,
        description,
        price,
        fileUrl,
      }
    });

    redirect("/dashboard/products");
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
          <CardDescription>Fill in the details for your new digital product.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createProduct} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" name="name" placeholder="e.g. Complete Web Dev Course" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" placeholder="Short description of the product" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input id="price" name="price" type="number" step="0.01" min="0" placeholder="0.00" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fileUrl">Secure File URL (Mock for now)</Label>
              <Input id="fileUrl" name="fileUrl" placeholder="https://s3.amazonaws.com/... (later handled via upload)" />
              <p className="text-xs text-muted-foreground">In a real app, you would upload a file directly to S3/R2 here.</p>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit">Save Product</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
