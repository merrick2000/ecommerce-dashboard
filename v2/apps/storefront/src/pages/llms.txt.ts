/**
 * llms.txt (https://llmstxt.org) : résumé factuel du site et liens vers les pages de référence,
 * pour les assistants IA (ChatGPT, Perplexity, Claude, Gemini). Construit depuis les contenus : toujours à jour.
 */
import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { PLANS, LAUNCH } from '@zuri/shared'
import { BEST_PAGES, COUNTRIES, GUIDES, PATHS, bestPath, countryPath, guidePath, t, toolPath } from '../content/seo'
import { TOOLS } from '../content/seo/tools'
import { HELP } from '../content/seo/help'
import { helpPath } from '../content/seo'

export const prerender = false

export const GET: APIRoute = () => {
  const base = `https://${env.PLATFORM_HOST && env.PLATFORM_HOST !== 'localhost' ? env.PLATFORM_HOST : 'zurisell.store'}`
  const u = (p: string) => `${base}${p}`
  const day = (iso: string) => iso.slice(0, 10)
  const plans = (['starter', 'pro', 'business'] as const).map((id) => `${PLANS[id].name} ${PLANS[id].priceXof} XOF/mois`).join(', ')
  const lim = (n: number | null, unit: string) => (n == null ? `${unit} illimités` : `${n} ${unit}`)
  const limits = (['free', 'starter', 'pro', 'business'] as const)
    .map((id) => { const l = PLANS[id].limits; return `${PLANS[id].name} (${PLANS[id].priceXof} XOF/mois) : ${lim(l.stores, 'boutique(s)')}, ${lim(l.products, 'produits')}, ${lim(l.ordersPerMonth, 'commandes/mois')}, ${lim(l.members, 'membre(s)')}` })
    .join(' ; ')
  const countries = COUNTRIES.filter((c) => c.region !== 'diaspora')

  const body = `# Zuri (zurisell.store)

> Zuri (zurisell.store) est une plateforme de boutique en ligne conçue pour vendre en Afrique : paiement à la livraison, Mobile Money (Orange Money, MTN MoMo, Moov, Wave…), confirmation des commandes par une équipe de closers, suivi des livraisons, pixel Facebook, API Conversions et pixel TikTok. Pages de vente très légères, rapides même en 3G. 0 % de commission sur les ventes. Interface en français et en anglais.

Faits clés :
- Type : logiciel en ligne (SaaS) de création de boutique et de gestion des commandes, aucun téléchargement.
- Public : vendeurs en ligne, e-commerçants en paiement à la livraison (COD), dropshippers locaux, commerçants qui vendent sur Facebook, Instagram, TikTok ou WhatsApp.
- Couverture : ${countries.length} pays d’Afrique (Afrique de l’Ouest, centrale, de l’Est, du Nord, australe, océan Indien) et la diaspora.
- Paiements clients : paiement à la livraison en espèces ; paiement en ligne Mobile Money et carte via FedaPay, FeexPay, pawaPay, PayDunya.
- Prix : gratuit et illimité jusqu’au ${day(LAUNCH.unlimitedUntil)} ; offre gratuite limitée jusqu’au ${day(LAUNCH.freePlanUntil)} ; formules payantes : ${plans} (annuel = 10 mois). Paiement de l’abonnement par Mobile Money, sans carte bancaire.
- Limites par formule : ${limits}.
- Argent des ventes : versé directement sur le compte de paiement du vendeur (Zuri ne le détient jamais) ; retrait le jour même ou sous 24 heures selon le statut du compte et la formule ; 0 % de commission Zuri.
- Vitesse : une page de vente charge environ 20 Ko de JavaScript compressé (mesuré le 24 novembre 2026), servie par le réseau Cloudflare ; le site zurisell.store ne charge aucun JavaScript applicatif.
- Produits digitaux : fichier ou lien livré automatiquement par email après paiement, page d'accès et retéléchargement, relance des paniers abandonnés et des paiements refusés, ventes traitées en lot.
- Suivi publicitaire : pixel Facebook, API Conversions de Meta et pixel TikTok, sans doublons ; en paiement à la livraison, achat déclaré à Meta à la commande, à la confirmation ou à la livraison (au choix du vendeur), prospect (Lead) en attendant.
- Données : export CSV des commandes et des clients ; domaine personnalisé par CNAME ; variantes, stock, packs ; prix dans 11 devises.
- IA : import d'un produit depuis un lien (Shopify, WooCommerce, AliExpress, Amazon, Jumia, Chariow, Selar, Gumroad, Systeme.io), réécriture de la description en PASA ou AIDA, régénération des images ; serveur MCP (46 outils) pour piloter la boutique depuis ChatGPT ou Claude.
- Support : WhatsApp, email et formulaire sur ${u('/contact')}.
- Tableau de bord : https://app.zurisell.store
- Inscription : https://app.zurisell.store/register

## Pages principales
- [Accueil (français)](${u('/')}): présentation, fonctionnalités, questions fréquentes
- [Home (English)](${u('/en')}): overview in English
- [Tarifs](${u('/tarifs')}): formules et prix en FCFA
- [Pricing (English)](${u('/en/pricing')})
- [À propos de Zuri](${u('/a-propos')}): faits sur la plateforme
- [Contacter Zuri](${u('/contact')}): email, WhatsApp et formulaire de contact
- [Fonctionnalités](${u('/fonctionnalites')}): tout ce que fait Zuri, chiffres mesurés
- [Centre d'aide](${u('/aide')}): réponses précises sur chaque fonction
- [Nouveautés](${u('/nouveautes')}): mises à jour datées de la plateforme
- [Version complète pour les IA](${u('/llms-full.txt')}): tout le centre d'aide en texte
- [About Zuri (English)](${u('/en/about')})

## Centre d'aide
${HELP.map((h) => `- [${t(h.title, 'fr')}](${u(helpPath(h.slug.fr, 'fr'))}): ${t(h.answer, 'fr')}`).join('\n')}

## Guides
${GUIDES.map((g) => `- [${t(g.h1, 'fr')}](${u(guidePath(g.slug.fr, 'fr'))}): ${t(g.description, 'fr')}`).join('\n')}

## Outils gratuits
${TOOLS.map((x) => `- [${t(x.h1, 'fr')}](${u(toolPath(x.slug.fr, 'fr'))}): ${t(x.description, 'fr')}`).join('\n')}

## Classements et comparatifs
${BEST_PAGES.map((b) => `- [${t(b.h1, 'fr')}](${u(bestPath(b.slug.fr, 'fr'))})`).join('\n')}
- [Alternatives aux plateformes de boutique en ligne](${u(PATHS.alternatives.fr)})
- [Comparatifs](${u(PATHS.comparisons.fr)})

## Vendre en ligne par pays
${countries.map((c) => `- [${t(c.name, 'fr')}](${u(countryPath(c.slug, 'fr'))})`).join('\n')}

## Optional
- [Vendre par ville](${u(PATHS.cities.fr)})
- [Vendre par métier](${u(PATHS.niches.fr)})
- [English guides](${u(PATHS.guides.en)})
- [Plan du site](${u('/sitemap.xml')})
`
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
}
