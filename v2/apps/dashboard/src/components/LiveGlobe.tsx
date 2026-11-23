/**
 * Globe 3D de la vue en direct : continents en points hexagonaux, visiteurs actifs (pastilles qui pulsent),
 * commandes récentes (onde plus large), rotation douce qui s'arrête dès qu'on manipule le globe.
 * WebGL via globe.gl (chargé seulement sur cette page).
 */
import Globe, { type GlobeInstance } from 'globe.gl'
import { Minus, Plus, LocateFixed } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { feature } from 'topojson-client'
import world from 'world-atlas/countries-110m.json'
import { ago, regionName } from '@/lib/traffic'

export type GlobePoint = { lat: number; lon: number; city: string | null; country: string | null; visitors: number }
export type GlobeOrder = { lat: number; lon: number; city: string | null; at: string }

/** Centre approximatif du pays de la boutique : vue de départ quand personne n'est en ligne. */
const HOME: Record<string, [number, number]> = {
  BJ: [9.3, 2.3], TG: [8.6, 0.8], CI: [7.5, -5.5], SN: [14.5, -14.5], BF: [12.2, -1.6], ML: [17.6, -4], NE: [17.6, 8.1], GN: [9.9, -9.7],
  CM: [7.4, 12.4], GA: [-0.8, 11.6], CG: [-0.2, 15.8], CD: [-4, 21.8], NG: [9.1, 8.7], GH: [7.9, -1], MA: [31.8, -7.1], TN: [33.9, 9.5],
  DZ: [28, 1.7], FR: [46.2, 2.2], BE: [50.5, 4.5], CA: [56.1, -106.3], US: [37.1, -95.7], RW: [-1.9, 29.9], MG: [-18.8, 47], KE: [0, 37.9],
}

const COLORS = {
  light: { globe: '#fbf7f0', land: 'rgba(146, 102, 46, 0.55)', atmosphere: '#f59e0b', visitor: '#d97706', order: '#059669' },
  dark: { globe: '#1f1b17', land: 'rgba(214, 196, 171, 0.42)', atmosphere: '#f59e0b', visitor: '#f59e0b', order: '#34d399' },
}

const land = (() => {
  type Topo = Parameters<typeof feature>[0]
  const topo = world as unknown as Topo & { objects: { countries: Parameters<typeof feature>[1] } }
  type Ring = [number, number][]
  type Geo = { type: 'Polygon'; coordinates: Ring[] } | { type: 'MultiPolygon'; coordinates: Ring[][] }
  const fc = feature(topo, topo.objects.countries) as unknown as { features: { id?: string | number; geometry: Geo | null }[] }
  // Un contour réduit à un point (il y en a dans la carte simplifiée) fait échouer le découpage en hexagones de tout le globe.
  const solid = (poly: Ring[]) => new Set(poly[0]?.map((p) => `${p[0]},${p[1]}`)).size >= 3
  return (
    fc.features
      // Sans l'Antarctique : il occupe beaucoup de place pour aucun visiteur.
      .filter((f) => f.id !== '010' && f.geometry)
      .map((f) => (f.geometry!.type === 'MultiPolygon' ? { ...f, geometry: { ...f.geometry!, coordinates: f.geometry!.coordinates.filter(solid) } } : f))
      .filter((f) => (f.geometry!.type === 'MultiPolygon' ? f.geometry!.coordinates.length > 0 : solid(f.geometry!.coordinates as Ring[])))
  )
})()

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
const isDark = () => document.documentElement.classList.contains('dark')
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

type Props = { points: GlobePoint[]; orders: GlobeOrder[]; country: string; focus?: { lat: number; lon: number; key: string } | null }

type Item = { kind: 'visitor' | 'order'; lat: number; lng: number; label: string; size: number; fresh: boolean }

export function LiveGlobe({ points, orders, country, focus }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const globe = useRef<GlobeInstance | null>(null)
  const idle = useRef<number | undefined>(undefined)

  // Création unique du globe.
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const g = new Globe(el, { animateIn: !reducedMotion(), rendererConfig: { antialias: true, alpha: true } })
    globe.current = g
    const home = HOME[country] ?? [8, 2]
    g.backgroundColor('rgba(0,0,0,0)')
      .showGraticules(false)
      .atmosphereAltitude(0.16)
      .hexPolygonsData(land)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.42)
      .hexPolygonUseDots(true)
      .hexPolygonAltitude(0.004)
      .pointAltitude((d) => ((d as Item).kind === 'order' ? 0.025 : 0.008 + Math.min(0.04, Math.log2(1 + (d as Item).size) * 0.01)))
      .pointRadius((d) => ((d as Item).kind === 'order' ? 0.75 : 0.55 + Math.min(0.6, (d as Item).size * 0.08)))
      .pointsMerge(false)
      .pointLabel((d) => (d as Item).label)
      .ringMaxRadius((d) => ((d as Item).kind === 'order' ? 8 : 4.5))
      .ringPropagationSpeed((d) => ((d as Item).kind === 'order' ? 3 : 1.6))
      .ringRepeatPeriod((d) => ((d as Item).kind === 'order' ? 1400 : 1800))
      .pointOfView({ lat: home[0], lng: home[1], altitude: 1.9 }, 0)
    const controls = g.controls()
    controls.autoRotate = !reducedMotion()
    controls.autoRotateSpeed = 0.35
    controls.enableDamping = true
    controls.minDistance = 130
    controls.maxDistance = 520
    // La rotation reprend quelques secondes après la dernière manipulation.
    const pause = () => {
      controls.autoRotate = false
      window.clearTimeout(idle.current)
      idle.current = window.setTimeout(() => (controls.autoRotate = !reducedMotion()), 8000)
    }
    controls.addEventListener('start', pause)

    const paint = () => {
      const c = isDark() ? COLORS.dark : COLORS.light
      const mat = g.globeMaterial() as unknown as { color: { set: (v: string) => void }; emissive?: { set: (v: string) => void }; emissiveIntensity?: number; shininess?: number }
      mat.color.set(c.globe)
      mat.emissive?.set(c.globe)
      mat.emissiveIntensity = 0.35
      mat.shininess = 4
      g.atmosphereColor(c.atmosphere)
        .hexPolygonColor(() => c.land)
        .pointColor((d) => ((d as Item).kind === 'order' ? c.order : c.visitor))
        .ringColor((d: object) => {
          const base = (d as Item).kind === 'order' ? c.order : c.visitor
          return (t: number) => `${base}${Math.round((1 - t) * 200).toString(16).padStart(2, '0')}`
        })
    }
    paint()
    const themeObs = new MutationObserver(paint)
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    const size = () => g.width(el.clientWidth).height(el.clientHeight)
    size()
    const ro = new ResizeObserver(size)
    ro.observe(el)

    return () => {
      ro.disconnect()
      themeObs.disconnect()
      window.clearTimeout(idle.current)
      controls.removeEventListener('start', pause)
      g._destructor()
      el.replaceChildren()
      globe.current = null
    }
  }, [country])

  // Données : à chaque rafraîchissement, sans recréer la scène.
  useEffect(() => {
    const g = globe.current
    if (!g) return
    const now = Date.now()
    const items: Item[] = [
      ...points.map((p) => ({
        kind: 'visitor' as const,
        lat: p.lat,
        lng: p.lon,
        size: p.visitors,
        fresh: true,
        label: tip(p.city, p.country, `${p.visitors} ${p.visitors > 1 ? 'visiteurs' : 'visiteur'} en ce moment`),
      })),
      ...orders.map((o) => ({
        kind: 'order' as const,
        lat: o.lat,
        lng: o.lon,
        size: 1,
        // Onde seulement pour les commandes des 5 dernières minutes : les plus anciennes restent en pastille.
        fresh: now - Date.parse(o.at) < 5 * 60_000,
        label: tip(o.city, null, `Commande il y a ${ago(o.at)}`),
      })),
    ]
    g.pointsData(items).ringsData(reducedMotion() ? [] : items.filter((i) => i.fresh))
  }, [points, orders])

  // Nouvelle commande : le globe s'y tourne.
  useEffect(() => {
    const g = globe.current
    if (!g || !focus) return
    g.controls().autoRotate = false
    g.pointOfView({ lat: focus.lat, lng: focus.lon, altitude: 1.7 }, reducedMotion() ? 0 : 1600)
    window.clearTimeout(idle.current)
    idle.current = window.setTimeout(() => {
      if (globe.current) globe.current.controls().autoRotate = !reducedMotion()
    }, 10000)
  }, [focus?.key]) // eslint-disable-line react-hooks/exhaustive-deps

  const zoom = (f: number) => {
    const g = globe.current
    if (!g) return
    const pov = g.pointOfView()
    g.pointOfView({ altitude: Math.min(4.2, Math.max(0.6, pov.altitude * f)) }, 400)
  }
  const recenter = () => {
    const g = globe.current
    if (!g) return
    const top = [...points].sort((a, b) => b.visitors - a.visitors)[0]
    const home = top ? [top.lat, top.lon] : (HOME[country] ?? [8, 2])
    g.pointOfView({ lat: home[0], lng: home[1], altitude: 1.9 }, 900)
  }

  return (
    <div className="relative size-full">
      <div ref={wrap} className="absolute inset-0 cursor-grab active:cursor-grabbing" aria-label="Globe des visiteurs en direct" role="img" />
      <div className="absolute bottom-3 right-3 hidden flex-col gap-1.5 sm:flex">
        <GlobeButton label="Zoom avant" onClick={() => zoom(0.75)}>
          <Plus className="size-4" />
        </GlobeButton>
        <GlobeButton label="Zoom arrière" onClick={() => zoom(1.33)}>
          <Minus className="size-4" />
        </GlobeButton>
        <GlobeButton label="Recentrer sur les visiteurs" onClick={recenter}>
          <LocateFixed className="size-4" />
        </GlobeButton>
      </div>
    </div>
  )
}

function GlobeButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label} className="grid size-9 place-items-center rounded-full border border-line bg-surface/90 text-muted shadow-sm backdrop-blur transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
      {children}
    </button>
  )
}

function tip(city: string | null, country: string | null, line: string) {
  const place = [city, country ? regionName(country) : null].filter(Boolean).join(', ') || 'Lieu inconnu'
  return `<div style="font: 500 12.5px/1.35 system-ui, sans-serif; padding: 6px 9px; border-radius: 8px; background: rgba(28,25,23,.92); color: #fafaf9; box-shadow: 0 6px 16px rgba(0,0,0,.25)"><div style="font-weight:600">${esc(place)}</div><div style="opacity:.8">${esc(line)}</div></div>`
}
