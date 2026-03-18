import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function StoresPage() {
  const stores = await prisma.store.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { products: true }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stores</h1>
          <p className="text-muted-foreground">Manage your different digital storefronts.</p>
        </div>
        <Link href="/dashboard/stores/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Store
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Stores</CardTitle>
          <CardDescription>A list of your storefronts.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Products Count</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                    No stores found. Create your first store to start selling!
                  </TableCell>
                </TableRow>
              ) : (
                stores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-medium">{store.name}</TableCell>
                    <TableCell>{store._count.products} products</TableCell>
                    <TableCell>{new Date(store.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                       <Link href={`/dashboard/stores/${store.id}`}>
                         <Button variant="outline" size="sm">Manage Store</Button>
                       </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
