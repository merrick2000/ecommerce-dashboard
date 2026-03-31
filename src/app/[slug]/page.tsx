import { fetchStoreCatalog } from "@/lib/api";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { StoreFooter } from "@/components/checkout/StoreFooter";
import { t, type Locale } from "@/lib/i18n";
import type { Metadata } from "next";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const data = await fetchStoreCatalog(slug);
    return {
      title: `${data.store.name} — Boutique`,
      description: `Découvrez les produits de ${data.store.name}`,
    };
  } catch {
    return {};
  }
}

export default async function StoreCatalogPage({ params }: Props) {
  const { slug } = await params;

  let data;
  try {
    data = await fetchStoreCatalog(slug);
  } catch {
    notFound();
  }

  const { store, products, checkout_config: config } = data;
  const locale: Locale = store.locale || "fr";
  const color = config.primary_color;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">
            {store.name}
          </h1>
          <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full">
            {store.currency}
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 py-10 w-full">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {t("catalog.title", locale)}
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            {t("catalog.subtitle", locale)} {store.name}
          </p>
        </div>

        {products.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/${store.slug}/p/${product.id}`}
                className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all"
              >
                {(product.thumbnail || product.cover_image) ? (
                  <div className="aspect-square overflow-hidden bg-gray-50 relative">
                    <Image
                      src={product.thumbnail || product.cover_image!}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-contain transition-transform duration-500 group-hover:scale-105"
                      priority={false}
                    />
                  </div>
                ) : (
                  <div
                    className="aspect-video flex items-center justify-center"
                    style={{ backgroundColor: color + "10" }}
                  >
                    <svg
                      className="w-12 h-12 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                )}

                <div className="p-5 space-y-3">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-gray-700 transition-colors">
                    {product.name}
                  </h3>

                  {product.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {product.description.replace(/<[^>]*>/g, "")}
                    </p>
                  )}

                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        {product.has_promo ? (
                          <>
                            <span
                              className="text-xl font-extrabold"
                              style={{ color }}
                            >
                              {product.formatted_effective_price}
                            </span>
                            <span className="text-sm text-gray-400 line-through">
                              {product.formatted_price}
                            </span>
                          </>
                        ) : (
                          <span
                            className="text-xl font-extrabold"
                            style={{ color }}
                          >
                            {product.formatted_price}
                          </span>
                        )}
                      </div>

                      {product.has_promo && product.promo_label && (
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: color + "15",
                            color,
                          }}
                        >
                          {product.promo_label}
                        </span>
                      )}
                    </div>

                    {product.currency_prices?.length > 0 && (
                      <div className="flex flex-wrap gap-x-2 text-xs text-gray-400">
                        {product.currency_prices.map((cp) => (
                          <span key={cp.currency}>
                            {product.has_promo && cp.effective_price !== cp.price ? (
                              <>
                                <span className="font-semibold text-gray-500">{cp.formatted_effective_price}</span>
                                {' '}
                                <span className="line-through">{cp.formatted_price}</span>
                              </>
                            ) : (
                              <span className="font-semibold text-gray-500">{cp.formatted_price}</span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div
                    className="w-full text-center py-2.5 rounded-xl text-sm font-bold text-white transition-opacity group-hover:opacity-90"
                    style={{ backgroundColor: color }}
                  >
                    {t("catalog.view_product", locale)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">
              {t("catalog.no_products", locale)}
            </p>
          </div>
        )}
      </main>

      <StoreFooter storeName={store.name} locale={locale} />
    </div>
  );
}
