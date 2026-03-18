import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Download } from "lucide-react";

export default async function SuccessPage({ params }: { params: Promise<{ productId: string }> }) {
  const productId = (await params).productId;

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-xl w-full text-center">
        <CardHeader className="flex flex-col items-center gap-4">
          <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-extrabold text-gray-900">Payment Successful!</CardTitle>
          <CardDescription className="text-lg">Thank you for purchasing {product.name}.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {product.thankYouMessage && (
            <div className="bg-blue-50 text-blue-800 p-6 rounded-lg text-left whitespace-pre-wrap">
              <h3 className="font-bold mb-2">Message from the creator:</h3>
              <p>{product.thankYouMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-xl font-semibold">Your Digital Product</h4>
            {product.fileUrl ? (
              <a href={product.fileUrl} download target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 text-lg">
                  <Download className="mr-2 h-6 w-6" />
                  Download File Now
                </Button>
              </a>
            ) : (
              <p className="text-red-500 font-medium">No file attached to this product yet.</p>
            )}
            <p className="text-sm text-gray-500 mt-4">
               A copy of your receipt has been sent to your email (mocked).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
