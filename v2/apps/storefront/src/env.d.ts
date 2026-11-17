/// <reference types="astro/client" />

declare module 'cloudflare:workers' {
  export const env: Cloudflare.Env
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void
  passThroughOnException(): void
}

declare namespace Cloudflare {
  interface Env {
    ASSETS: { fetch: typeof fetch }
    /** Origine de apps/api, ex. https://api-origin.example.com */
    API_ORIGIN: string
    /** Secret partagé avec l'API (en-tête x-edge-secret). */
    EDGE_SECRET?: string
    /** Hôte « plateforme » (ex. zurisell.store) : les URLs portent le slug. */
    PLATFORM_HOST?: string
    /** Domaine racine des sous-domaines boutiques (ex. zurisell.store). */
    BASE_DOMAIN?: string
    /** "cloudflare" pour servir les images via /cdn-cgi/image (Image Resizing activé sur la zone). */
    IMAGE_RESIZING?: string
    /** "off" pour désactiver le cache HTML en périphérie (debug). */
    EDGE_CACHE?: string
  }
}

declare namespace App {
  interface Locals {
    cfContext?: ExecutionContext
    /** Slug de la boutique quand l'hôte est un sous-domaine / domaine perso (sinon null). */
    hostSlug: string | null
    /** Préfixe des liens internes : '' sur un domaine boutique, '/:slug' sur l'hôte plateforme. */
    storeBase: string
    /** Origine publique vue par le visiteur (https://boutique.com). */
    publicOrigin: string
    /** Chemin public d'origine (avant réécriture). */
    publicPath: string
  }
}
