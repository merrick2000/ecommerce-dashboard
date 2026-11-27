/** Preuve sociale RÉELLE : uniquement les ventes renvoyées par /recent-sales (jamais de noms inventés). */
type Sale = { firstName: string; city: string | null; product: string; at: string | null; text?: string | null; image?: string | null }

export async function startPopup(el: HTMLElement): Promise<void> {
  const { slug, interval, bought, from, template, recent, product, store, notifTitle } = el.dataset
  const notif = el.classList.contains('popup-notif')
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
  // Messages du vendeur (sans heure) : texte fixe s'il l'a choisi, sinon un moment varié et crédible,
  // le même pour un message pendant toute la visite (pas de « il y a 3 min » puis « il y a 2 h » pour le même).
  const varied = new Map<string, number>()
  const variedMinutes = (key: string) => {
    let m = varied.get(key)
    if (m == null) {
      const r = Math.random()
      m = r < 0.4 ? 2 + Math.floor(Math.random() * 14) : r < 0.75 ? 16 + Math.floor(Math.random() * 44) : 60 + Math.floor(Math.random() * 240)
      varied.set(key, m)
    }
    return m
  }
  const rel = (iso: string | null, key = '') => {
    if (!iso && recent) return recent
    const min = iso ? Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000)) : variedMinutes(key)
    // ago = [à l'instant, "il y a {n} min", "il y a {n} h", "il y a {n} j"]
    if (min < 1) return ago[0] ?? ''
    if (min < 60) return (ago[1] ?? '').replace('{n}', String(min))
    if (min < 1440) return (ago[2] ?? '').replace('{n}', String(Math.round(min / 60)))
    return (ago[3] ?? '').replace('{n}', String(Math.round(min / 1440)))
  }
  const hide = () => {
    el.classList.add('leaving')
    el.classList.remove('show')
    el.style.transform = ''
  }
  // Notification : glisser vers le haut pour la fermer.
  if (notif) {
    let y0: number | null = null
    el.addEventListener('touchstart', (e) => (y0 = e.touches[0]?.clientY ?? null), { passive: true })
    el.addEventListener(
      'touchmove',
      (e) => {
        if (y0 == null) return
        const dy = Math.min(0, (e.touches[0]?.clientY ?? y0) - y0)
        el.style.transition = 'none'
        el.style.transform = `translate(-50%, ${dy}px)`
      },
      { passive: true },
    )
    el.addEventListener('touchend', (e) => {
      if (y0 == null) return
      const dy = (e.changedTouches[0]?.clientY ?? y0) - y0
      el.style.transition = ''
      y0 = null
      if (dy < -25) hide()
      else el.style.transform = ''
    })
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
    const when = rel(s.at, `${s.firstName}|${s.product}|${s.city ?? ''}`)
    if (notif) {
      // Comme une notification de téléphone : icône, boutique et heure, titre, message.
      let icon: HTMLElement
      if (s.image) {
        const im = document.createElement('img')
        im.src = s.image
        im.alt = ''
        im.width = 40
        im.height = 40
        icon = im
      } else {
        icon = document.createElement('span')
        icon.textContent = (store ?? '?').trim().charAt(0).toUpperCase()
      }
      icon.className = 'notif-icon'
      const head = document.createElement('div')
      head.className = 'notif-head'
      const app = document.createElement('span')
      app.className = 'notif-app'
      app.textContent = store ?? ''
      const time = document.createElement('span')
      time.className = 'notif-time'
      time.textContent = when
      head.append(app, time)
      const title = document.createElement('div')
      title.className = 'notif-title'
      title.textContent = notifTitle ?? ''
      const main = document.createElement('div')
      main.className = 'notif-main'
      main.append(head, title, p)
      const grab = document.createElement('span')
      grab.className = 'notif-grab'
      grab.setAttribute('aria-hidden', 'true')
      el.replaceChildren(icon, main, grab)
    } else {
      const small = document.createElement('small')
      small.textContent = when
      const body = document.createElement('div')
      body.className = 'popup-body'
      body.append(p, small)
      el.append(body)
    }
    el.classList.remove('leaving')
    el.style.transform = ''
    el.classList.add('show')
    setTimeout(hide, notif ? 5500 : 5000)
    // On ne boucle pas indéfiniment sur les mêmes ventes.
    if (i < sales.length * 2) setTimeout(show, every)
  }
  show()
}
