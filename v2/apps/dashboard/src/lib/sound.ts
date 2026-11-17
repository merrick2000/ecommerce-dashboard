/**
 * Sons de notification, synthétisés avec Web Audio (aucun fichier à charger).
 * Volontairement doux : un « encaissement » feutré, pas une caisse enregistreuse agressive.
 * Réglages par appareil (localStorage) : son choisi et volume.
 */

export const SOUNDS = {
  cash: { label: 'Encaissement doux', description: 'Deux notes claires et une pluie de pièces légère.' },
  bell: { label: 'Clochette', description: 'Une note de cloche ronde.' },
  drop: { label: 'Goutte', description: 'Très discret, pour les bureaux calmes.' },
  none: { label: 'Aucun son', description: 'Notification visuelle seulement.' },
} as const
export type SoundId = keyof typeof SOUNDS

const KEY = 'zuri:sound'
export interface SoundSettings {
  sound: SoundId
  /** 0..1 */
  volume: number
}
const DEFAULTS: SoundSettings = { sound: 'cash', volume: 0.6 }

export function getSoundSettings(): SoundSettings {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<SoundSettings> | null
    if (!raw) return DEFAULTS
    return { sound: raw.sound && raw.sound in SOUNDS ? raw.sound : DEFAULTS.sound, volume: typeof raw.volume === 'number' ? Math.min(1, Math.max(0, raw.volume)) : DEFAULTS.volume }
  } catch {
    return DEFAULTS
  }
}

export function setSoundSettings(s: SoundSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* navigation privée : réglage non mémorisé */
  }
}

let ctx: AudioContext | null = null
function audio(): AudioContext | null {
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/**
 * Les navigateurs bloquent le son tant que l'utilisateur n'a pas interagi avec la page :
 * on « déverrouille » l'audio au premier clic/toucher.
 */
export function unlockAudioOnFirstGesture() {
  const unlock = () => {
    audio()
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }
  window.addEventListener('pointerdown', unlock, { once: true })
  window.addEventListener('keydown', unlock, { once: true })
}

/** Note douce : sinus + harmonique, attaque rapide, longue décroissance. */
function tone(c: AudioContext, out: AudioNode, freq: number, start: number, duration: number, gain: number, type: OscillatorType = 'sine') {
  const g = c.createGain()
  g.gain.setValueAtTime(0, start)
  g.gain.linearRampToValueAtTime(gain, start + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  g.connect(out)
  const o = c.createOscillator()
  o.type = type
  o.frequency.setValueAtTime(freq, start)
  o.connect(g)
  o.start(start)
  o.stop(start + duration + 0.05)
  // Harmonique légère pour un timbre « métal doux ».
  const g2 = c.createGain()
  g2.gain.setValueAtTime(0, start)
  g2.gain.linearRampToValueAtTime(gain * 0.25, start + 0.01)
  g2.gain.exponentialRampToValueAtTime(0.0001, start + duration * 0.6)
  g2.connect(out)
  const o2 = c.createOscillator()
  o2.type = 'sine'
  o2.frequency.setValueAtTime(freq * 2.76, start)
  o2.connect(g2)
  o2.start(start)
  o2.stop(start + duration)
}

export function playSound(id?: SoundId, volume?: number) {
  const settings = getSoundSettings()
  const sound = id ?? settings.sound
  const vol = volume ?? settings.volume
  if (sound === 'none' || vol <= 0) return
  const c = audio()
  if (!c) return
  const master = c.createGain()
  master.gain.value = vol * 0.5
  // Filtre passe-bas : arrondit les aigus, rien d'agressif.
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 6000
  master.connect(lp)
  lp.connect(c.destination)
  const t = c.currentTime + 0.02
  if (sound === 'cash') {
    tone(c, master, 1318.5, t, 0.5, 0.5) // mi 6
    tone(c, master, 1760, t + 0.11, 0.9, 0.45) // la 6
    // Quelques « pièces » très légères.
    ;[0.24, 0.31, 0.36, 0.44].forEach((d, i) => tone(c, master, 2637 + i * 190, t + d, 0.18, 0.07, 'triangle'))
  } else if (sound === 'bell') {
    tone(c, master, 880, t, 1.4, 0.55)
    tone(c, master, 1320, t, 1.0, 0.18)
  } else if (sound === 'drop') {
    const g = c.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.5, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
    g.connect(master)
    const o = c.createOscillator()
    o.frequency.setValueAtTime(1200, t)
    o.frequency.exponentialRampToValueAtTime(520, t + 0.18)
    o.connect(g)
    o.start(t)
    o.stop(t + 0.4)
  }
}
