import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { uploadFile } from "@/lib/upload";

export default function NewProductPage() {

  // Server Action to create a new product
  async function createProduct(formData: FormData) {
    "use server"

    const { requireAuth } = await import('@/lib/auth');
    await requireAuth(); // Securing the endpoint

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const currency = formData.get("currency") as string;
    const thankYouMessage = formData.get("thankYouMessage") as string;

    let coverImageUrl = "";
    let fileUrlUrl = "";

    // Handle Cover Image Upload
    const coverImage = formData.get("coverImage") as File | null;
    if (coverImage && coverImage.size > 0) {
      coverImageUrl = await uploadFile(coverImage);
    }

    // Handle Digital File Upload
    const fileUrl = formData.get("fileUrl") as File | null;
    if (fileUrl && fileUrl.size > 0) {
      fileUrlUrl = await uploadFile(fileUrl);
    }

    if (!name || isNaN(price)) {
      throw new Error("Invalid input");
    }

    await prisma.product.create({
      data: {
        name,
        description,
        price,
        currency,
        coverImage: coverImageUrl || null,
        fileUrl: fileUrlUrl || null,
        thankYouMessage,
      }
    });

    redirect("/dashboard/products");
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
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
          <CardDescription>Upload your digital product and set up your sales funnel.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Note: encType="multipart/form-data" is required when uploading files */}
          <form action={createProduct} className="space-y-6">

            <div className="grid gap-4 md:grid-cols-2">
               <div className="space-y-2">
                 <Label htmlFor="name">Product Name</Label>
                 <Input id="name" name="name" placeholder="e.g. Master React in 30 Days" required />
               </div>

               <div className="space-y-2">
                 <Label htmlFor="coverImage">Cover Image (JPEG/PNG)</Label>
                 <Input id="coverImage" name="coverImage" type="file" accept="image/*" />
               </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Product Description (for Sales Page)</Label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="What will the customer learn or get?"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input id="price" name="price" type="number" step="0.01" min="0" placeholder="0.00" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  name="currency"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                </select>
              </div>
            </div>

            <hr className="my-4 border-gray-200" />

            <div className="space-y-4">
               <h3 className="text-lg font-semibold">Delivery & Fulfillment</h3>
               <div className="space-y-2">
                 <Label htmlFor="fileUrl">Digital File to Deliver (ZIP, PDF, Video)</Label>
                 <Input id="fileUrl" name="fileUrl" type="file" required />
                 <p className="text-xs text-muted-foreground">The customer will receive this file immediately after a successful payment.</p>
               </div>

               <div className="space-y-2">
                 <Label htmlFor="thankYouMessage">Thank You Message (Post-Purchase)</Label>
                 <textarea
                   id="thankYouMessage"
                   name="thankYouMessage"
                   rows={3}
                   className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                   placeholder="Thank you for your purchase! Here is your download link and some extra instructions..."
                 />
               </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" size="lg">Create Product</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
