import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Store {
  id: number;
  name: string;
  slug: string;
  currency: string;
}

async function getStores(): Promise<Store[]> {
  try {
    const res = await fetch(`${API_BASE}/v1/stores`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function Home() {
  const stores = await getStores();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Storefront</h1>
          <a
            href={`${process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:8000/admin"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Admin Panel &rarr;
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Boutiques disponibles
          </h2>
          <p className="text-gray-500">
            Cliquez sur une boutique pour accéder à son tunnel de vente.
          </p>
        </div>

        {stores.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {stores.map((store) => (
              <Link
                key={store.id}
                href={`/${store.slug}`}
                className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {store.name}
                </h3>
                <p className="text-sm text-gray-400 mt-1">/{store.slug}</p>
                <span className="inline-block mt-3 text-xs font-medium px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full">
                  {store.currency}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Aucune boutique pour le moment.</p>
            <p className="text-sm mt-2">
              Créez une boutique depuis le{" "}
              <a
                href={`${process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:8000/admin"}`}
                className="text-orange-500 underline"
                target="_blank"
              >
                panel admin
              </a>
              .
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
