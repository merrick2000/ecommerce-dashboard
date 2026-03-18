import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";

export default async function PublicProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const productId = (await params).productId;

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden md:flex">
        {/* Product Image Section */}
        <div className="md:w-1/2 bg-gray-100 flex items-center justify-center min-h-[300px] relative">
          {product.coverImage ? (
             <Image
               src={product.coverImage}
               alt={product.name}
               fill
               className="object-cover"
               priority
             />
          ) : (
             <div className="text-gray-400 font-medium">No Cover Image Available</div>
          )}
        </div>

        {/* Product Details Section */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold mb-1">
            Digital Product
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{product.name}</h1>

          <div className="prose prose-sm text-gray-600 mb-8 whitespace-pre-wrap">
            {product.description || "No description provided for this amazing digital product."}
          </div>

          <div className="flex items-center gap-4 mb-8">
            <span className="text-4xl font-black text-gray-900">
              {product.price.toFixed(2)} {product.currency}
            </span>
          </div>

          <Link href={`/checkout/${product.id}`} className="w-full block">
            <Button size="lg" className="w-full text-lg py-6 bg-indigo-600 hover:bg-indigo-700">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Buy Now
            </Button>
          </Link>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
             <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
             </svg>
             Secure Checkout powered by FakeStripe
          </div>
        </div>
      </div>
    </div>
  );
}
