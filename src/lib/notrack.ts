/**
 * Gère l'exclusion du tracking pour le propriétaire de la boutique.
 * Visite la boutique avec ?notrack pour désactiver le tracking.
 * Visite avec ?track pour le réactiver.
 */
export function initNoTrack(): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);

  if (params.has("notrack")) {
    localStorage.setItem("_slt_notrack", "1");
  } else if (params.has("track")) {
    localStorage.removeItem("_slt_notrack");
  }
}

export function isNoTrack(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("_slt_notrack") === "1";
}
