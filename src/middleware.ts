import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "sellit.com";
const APP_HOST = process.env.NEXT_PUBLIC_APP_HOST || "sellit.com";

// Cache domain → slug pour éviter un appel API à chaque requête
const domainCache = new Map<string, { slug: string; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // Ignorer les assets, API, et le domaine principal
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    host === APP_HOST ||
    host === `www.${APP_HOST}` ||
    host.startsWith("localhost")
  ) {
    return NextResponse.next();
  }

  // Vérifier si c'est un sous-domaine Sellit ou un domaine custom
  const isSubdomain = host.endsWith(`.${BASE_DOMAIN}`) && host !== BASE_DOMAIN;
  const isCustomDomain = !host.includes(BASE_DOMAIN) && !host.startsWith("localhost");

  if (!isSubdomain && !isCustomDomain) {
    return NextResponse.next();
  }

  // Résoudre le domaine en slug
  let slug: string | null = null;

  // Check cache
  const cached = domainCache.get(host);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    slug = cached.slug;
  } else {
    try {
      const res = await fetch(`${API_BASE}/v1/stores/resolve/domain?host=${encodeURIComponent(host)}`, {
        next: { revalidate: 300 },
      });
      if (res.ok) {
        const data = await res.json();
        slug = data.slug;
        domainCache.set(host, { slug: data.slug, ts: Date.now() });
      }
    } catch {
      // API down, pass through
    }
  }

  if (!slug) {
    return NextResponse.next();
  }

  // Rewrite : le domaine pointe vers la boutique
  // shop.monbrand.com/ → /slug
  // shop.monbrand.com/p/123 → /slug/p/123
  const url = request.nextUrl.clone();

  if (pathname === "/") {
    url.pathname = `/${slug}`;
  } else {
    url.pathname = `/${slug}${pathname}`;
  }

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
