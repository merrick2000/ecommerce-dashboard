import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default function NewStorePage() {

  async function createStore(formData: FormData) {
    "use server"

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    const { requireAuth } = await import('@/lib/auth');
    const user = await requireAuth();

    if (!name) {
      throw new Error("Invalid input");
    }

    await prisma.store.create({
      data: {
        name,
        description,
        userId: user.id
      }
    });

    redirect("/dashboard/stores");
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/stores">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Store</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Store Details</CardTitle>
          <CardDescription>Setup a new storefront to sell your products.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createStore} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Store Name</Label>
              <Input id="name" name="name" placeholder="e.g. My Ebook Store" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" placeholder="What is this store about?" />
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit">Create Store</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
