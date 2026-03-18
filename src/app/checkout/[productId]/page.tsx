import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, CheckCircle } from "lucide-react";

export default async function CheckoutPage({ params }: { params: Promise<{ productId: string }> }) {
  const productId = (await params).productId;

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    notFound();
  }

  // Fake Server Action for checkout processing
  async function processFakePayment(formData: FormData) {
    "use server"

    // Simulate payment delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Redirect to the success page
    redirect(`/checkout/${productId}/success`);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
          <p className="text-gray-500">You are about to purchase {product.name}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 items-start">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex justify-between items-center font-medium">
                 <span>{product.name}</span>
                 <span>{product.price.toFixed(2)} {product.currency}</span>
               </div>
               <hr />
               <div className="flex justify-between items-center font-bold text-lg">
                 <span>Total</span>
                 <span>{product.price.toFixed(2)} {product.currency}</span>
               </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Details
              </CardTitle>
              <CardDescription>Enter any data, this is a mock checkout.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={processFakePayment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" placeholder="you@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card">Card Information</Label>
                  <Input id="card" type="text" placeholder="4242 4242 4242 4242" required />
                  <div className="flex gap-2">
                    <Input id="exp" type="text" placeholder="MM/YY" required className="w-1/2" />
                    <Input id="cvc" type="text" placeholder="CVC" required className="w-1/2" />
                  </div>
                </div>

                <Button type="submit" className="w-full mt-4" size="lg">
                  Pay {product.price.toFixed(2)} {product.currency}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
