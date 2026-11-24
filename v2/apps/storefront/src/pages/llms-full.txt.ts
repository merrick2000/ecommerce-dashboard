/**
 * llms-full.txt : le centre d'aide complet en texte brut (français puis anglais), pour que les assistants IA
 * répondent précisément sur Zuri sans avoir à parcourir le site. Construit depuis les contenus : toujours à jour.
 */
import type { APIRoute } from 'astro'
import { PLANS } from '@zuri/shared'
import { HELP, HELP_TOPICS } from '../content/seo/help'
import { CHANGELOG } from '../content/seo/changelog'
import { helpPath, t } from '../content/seo'
import type { Block, Lang } from '../content/seo'

export const prerender = false

const text = (b: Block, lang: Lang): string => {
  if (b.type === 'p') return t(b.text, lang)
  if (b.type === 'h2') return `\n### ${t(b.text, lang)}`
  if (b.type === 'h3') return `\n#### ${t(b.text, lang)}`
  if (b.type === 'list') return b.items.map((i, k) => `${b.ordered ? `${k + 1}.` : '-'} ${t(i, lang)}`).join('\n')
  if (b.type === 'tip') return `> ${t(b.title, lang)} : ${t(b.text, lang)}`
  if (b.type === 'table') return b.rows.map((r) => `| ${r.map((c) => t(c, lang)).join(' | ')} |`).join('\n')
  return ''
}

export const GET: APIRoute = () => {
  const u = (p: string) => `https://zurisell.store${p}`
  const section = (lang: Lang) =>
    HELP.map((a) =>
      [
        `## ${t(a.title, lang)}`,
        `URL : ${u(helpPath(a.slug[lang], lang))}`,
        `${lang === 'fr' ? 'Rubrique' : 'Topic'} : ${t(HELP_TOPICS[a.topic], lang)}`,
        '',
        `${lang === 'fr' ? 'Réponse' : 'Answer'} : ${t(a.answer, lang)}`,
        '',
        ...a.blocks.map((b) => text(b, lang)),
        ...a.faqs.flatMap((f) => ['', `Q : ${t(f.q, lang)}`, `R : ${t(f.a, lang)}`]),
      ].join('\n'),
    ).join('\n\n')
  const plans = (['free', 'starter', 'pro', 'business'] as const).map((id) => `- ${PLANS[id].name} : ${PLANS[id].priceXof} XOF/mois, ${JSON.stringify(PLANS[id].limits)}`).join('\n')
  const body = `# Zuri (zurisell.store) : centre d'aide complet

Zuri est une plateforme de boutique en ligne pour vendre en Afrique : paiement à la livraison, Mobile Money (FedaPay, FeexPay, PayDunya, pawaPay), closers, produits physiques et digitaux, 0 % de commission. Site : https://zurisell.store. Tableau de bord : https://app.zurisell.store. Mis à jour le ${CHANGELOG[0]?.date}.

## Formules (null = illimité)
${plans}

# Français

${section('fr')}

# English

${section('en')}

# Dernières nouveautés
${CHANGELOG.map((e) => `- ${e.date} : ${t(e.title, 'fr')}`).join('\n')}
`
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
}
