/** Preuve sociale RÉELLE : uniquement les ventes renvoyées par /recent-sales (jamais de noms inventés). */
type Sale = { firstName: string; city: string | null; product: string; at: string | null; text?: string | null; image?: string | null }

export async function startPopup(el: HTMLElement): Promise<void> {
  const { slug, interval, bought, from, template, recent, product } = el.dataset
  let ago: string[] = []
  try {
    ago = JSON.parse(el.dataset.ago ?? '[]') as string[]
  } catch {
    /* ignore */
  }
  let sales: Sale[] = []
  try {
    const r = await fetch(`/api/v1/stores/${encodeURIComponent(slug!)}/recent-sales${product ? `?product=${encodeURIComponent(product)}` : ''}`)
    if (r.ok) sales = (await r.json()) as Sale[]
  } catch {
    return
  }
  if (!sales.length) return
  const every = Math.max(8, Number(interval) || 20) * 1000
  /** Message : texte de l'entrée, sinon modèle de la boutique ({prenom}, {ville}, {produit}), sinon texte par défaut. */
  // Noms de produits longs : coupés proprement (le message reste lisible sur téléphone).
  const short = (name: string) => (name.length > 46 ? `${name.slice(0, 44).trimEnd()}…` : name)
  const fill = (tpl: string, sale: Sale) =>
    tpl
      .replace(/\{prenom\}/gi, sale.firstName)
      .replace(/\{produit\}/gi, short(sale.product))
      .replace(/\{ville\}/gi, sale.city ?? '')
      .replace(/\s+(de|from|à|in)\s+(?=[,.!?]|\s|$)/gi, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
  const rel = (iso: string | null) => {
    if (!iso) return recent ?? ''
    const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
    // ago = [à l'instant, "il y a {n} min", "il y a {n} h", "il y a {n} j"]
    if (min < 1) return ago[0] ?? ''
    if (min < 60) return (ago[1] ?? '').replace('{n}', String(min))
    if (min < 1440) return (ago[2] ?? '').replace('{n}', String(Math.round(min / 60)))
    return (ago[3] ?? '').replace('{n}', String(Math.round(min / 1440)))
  }
  let i = 0
  const show = () => {
    const s = sales[i++ % sales.length]!
    el.replaceChildren()
    const p = document.createElement('div')
    p.className = 'popup-msg'
    p.title = s.product
    const custom = s.text || template
    if (custom) p.textContent = fill(custom, s)
    else {
      const b = document.createElement('strong')
      b.textContent = s.firstName
      p.append(b, ` ${s.city ? `${from} ${s.city} ` : ''}${bought} « ${short(s.product)} »`)
    }
    // Style « carte » : photo du produit à gauche du message.
    if (el.classList.contains('popup-card') && s.image) {
      const im = document.createElement('img')
      im.src = s.image
      im.alt = ''
      im.width = 44
      im.height = 44
      im.className = 'popup-img'
      el.append(im)
    }
    const small = document.createElement('small')
    small.textContent = rel(s.at)
    const body = document.createElement('div')
    body.className = 'popup-body'
    body.append(p, small)
    el.append(body)
    el.classList.add('show')
    setTimeout(() => el.classList.remove('show'), 5000)
    // On ne boucle pas indéfiniment sur les mêmes ventes.
    if (i < sales.length * 2) setTimeout(show, every)
  }
  show()
}
