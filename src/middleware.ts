import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "sellit.com";
const APP_HOST = process.env.NEXT_PUBLIC_APP_HOST || "sellit.com";

// Cache domain → slug
const domainCache = new Map<string, { slug: string; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function resolveSlug(host: string): Promise<string | null> {
  const cached = domainCache.get(host);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.slug;
  }

  try {
    const res = await fetch(`${API_BASE}/v1/stores/resolve/domain?host=${encodeURIComponent(host)}`);
    if (res.ok) {
      const data = await res.json();
      domainCache.set(host, { slug: data.slug, ts: Date.now() });
      return data.slug;
    }
  } catch {
    // API down
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // Ignorer les assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Vérifier si c'est un domaine custom ou sous-domaine
  const isSubdomain = host.endsWith(`.${BASE_DOMAIN}`) && host !== BASE_DOMAIN;
  const isCustomDomain = !host.includes(BASE_DOMAIN) && !host.startsWith("localhost");

  if (!isSubdomain && !isCustomDomain) {
    return NextResponse.next();
  }

  const slug = await resolveSlug(host);
  if (!slug) {
    return NextResponse.next();
  }

  // Si le path commence déjà par le slug, ne pas préfixer (évite le doublon)
  if (pathname.startsWith(`/${slug}`)) {
    return NextResponse.next();
  }

  // Rewrite : préfixer le slug
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
