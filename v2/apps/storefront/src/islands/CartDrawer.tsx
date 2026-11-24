/**
 * Panier flottant : bouton avec le nombre d'articles, volet avec les lignes (prix réels relus par l'API),
 * quantités, retrait, et « Commander » qui ouvre le formulaire de la boutique avec tout le panier.
 */
import { useEffect, useState } from 'preact/hooks'
import { cartCount, readCart, removeFromCart, setCartQuantity, type CartLine } from '../client/cart'
import { api } from '../client/http'
import { money, roundMoney } from '../lib/format'
import type { CartStrings } from '../lib/i18n'

export default function CartDrawer({ storeId, slug, locale, productBase, t }: { storeId: string; slug: string; locale: string; productBase: string; t: CartStrings }) {
  const [count, setCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [lines, setLines] = useState<CartLine[] | null>(null)

  const load = async () => {
    const items = readCart(storeId)
    if (!items.length) return setLines([])
    const r = await api<CartLine[]>('/cart/lines', { body: { storeSlug: slug, items } })
    setLines(r.ok && r.data ? r.data : [])
  }

  useEffect(() => {
    setCount(cartCount(storeId))
    const onChange = (e: Event) => {
      if ((e as CustomEvent).detail?.storeId !== storeId) return
      setCount(cartCount(storeId))
      if ((e as CustomEvent).detail?.open) setOpen(true)
      void load()
    }
    window.addEventListener('sf-cart', onChange)
    return () => window.removeEventListener('sf-cart', onChange)
  }, [])
  useEffect(() => {
    if (open) void load()
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    if (open) document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [open])

  if (!count && !open) return null
  const ok = (lines ?? []).filter((l) => l.available)
  const currency = ok[0]?.currency ?? 'XOF'
  const total = roundMoney(ok.reduce((s, l) => s + (l.total ?? 0), 0), currency)
  // Le formulaire s'ouvre sur le premier produit du panier ; les autres y sont ajoutés.
  const first = ok[0]
  const checkoutUrl = first ? `${productBase}${first.productId}?panier=1#commander` : null

  return (
    <>
      <button type="button" class="cart-pill" onClick={() => setOpen(true)} aria-label={`${t.open} (${count})`}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2 2h2l2.7 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L22 6H5.1" />
        </svg>
        <span class="cart-count">{count}</span>
      </button>
      {open && (
        <div class="cart-back" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div class="cart-drawer" role="dialog" aria-modal="true" aria-label={t.title}>
            <header class="cart-head">
              <h2>{t.title}</h2>
              <button type="button" class="cart-x" onClick={() => setOpen(false)} aria-label={t.close}>
                ×
              </button>
            </header>
            {lines == null ? (
              <p class="muted cart-pad">…</p>
            ) : !lines.length ? (
              <p class="muted cart-pad">{t.empty}</p>
            ) : (
              <ul class="cart-lines">
                {lines.map((l) => (
                  <li key={`${l.productId}-${l.variantId}`} class={l.available ? '' : 'cart-off'}>
                    {l.image ? <img src={l.image} alt="" width="56" height="56" loading="lazy" /> : <span class="cart-ph" />}
                    <div class="cart-info">
                      <p class="cart-name">{l.name ?? '…'}</p>
                      {l.variantName && <p class="muted cart-small">{l.variantName}</p>}
                      {l.available ? (
                        <div class="cart-qty">
                          {l.type === 'physical' && (
                            <>
                              <button type="button" onClick={() => setCartQuantity(storeId, l.productId, l.variantId, (l.quantity ?? 1) - 1)} aria-label="-">
                                −
                              </button>
                              <span>{l.quantity}</span>
                              <button type="button" onClick={() => setCartQuantity(storeId, l.productId, l.variantId, (l.quantity ?? 1) + 1)} aria-label="+">
                                +
                              </button>
                            </>
                          )}
                          <strong>{money(l.total ?? 0, l.currency ?? currency, locale)}</strong>
                        </div>
                      ) : (
                        <p class="cart-small cart-warn">{t.unavailable}</p>
                      )}
                    </div>
                    <button type="button" class="cart-rm" onClick={() => removeFromCart(storeId, l.productId, l.variantId)}>
                      {t.remove}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {ok.length > 0 && checkoutUrl && (
              <footer class="cart-foot">
                <p>
                  <span>{t.total}</span>
                  <strong>{money(total, currency, locale)}</strong>
                </p>
                <a class="btn btn-block cart-go" href={checkoutUrl}>
                  {t.checkout}
                </a>
              </footer>
            )}
          </div>
        </div>
      )}
    </>
  )
}
