/**
 * Nouvelle version déployée pendant que le tableau de bord était ouvert : les anciens fichiers n'existent plus.
 * On recharge sans rien afficher d'alarmant, en forçant le navigateur à reprendre la page à jour.
 * Plusieurs essais rapprochés (déploiements successifs), puis un essai toutes les 8 s tant que ça ne passe pas.
 */
const KEY = 'zuri:new-version'

export const isStaleChunkError = (err: unknown) =>
  err instanceof Error && /dynamically imported module|Importing a module script failed|Failed to load module script|error loading dynamically|Unable to preload CSS|Failed to fetch dynamically|property "default" of undefined|reading 'default'|Cannot read properties of undefined \(reading 'default'\)/i.test(err.message)

let pending = false

async function hardReload() {
  try {
    await fetch(window.location.href, { cache: 'reload', credentials: 'include' })
  } catch {
    /* hors ligne : le rechargement réessaiera */
  }
  window.location.reload()
}

export function reloadForNewVersion() {
  if (pending) return
  pending = true
  let state = { n: 0, first: Date.now() }
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as typeof state | null
    if (saved && Date.now() - saved.first < 120_000) state = saved
  } catch {
    /* stockage indisponible */
  }
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ n: state.n + 1, first: state.first }))
  } catch {
    /* stockage indisponible */
  }
  // Les 3 premiers essais tout de suite, ensuite on laisse au déploiement le temps de finir.
  if (state.n < 3) void hardReload()
  else window.setTimeout(() => void hardReload(), 8000)
}
