/** Accès au stockage navigateur : peut lever (navigation privée, quota) → toujours protégé. */
type Area = 'local' | 'session'

function area(a: Area): Storage | null {
  try {
    return a === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

export function getJSON<T>(key: string, a: Area = 'local'): T | null {
  try {
    const raw = area(a)?.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function setJSON(key: string, value: unknown, a: Area = 'local'): void {
  try {
    area(a)?.setItem(key, JSON.stringify(value))
  } catch {
    /* quota / privé */
  }
}

export function getStr(key: string, a: Area = 'local'): string | null {
  try {
    return area(a)?.getItem(key) ?? null
  } catch {
    return null
  }
}

export function setStr(key: string, value: string, a: Area = 'local'): void {
  try {
    area(a)?.setItem(key, value)
  } catch {
    /* quota / privé */
  }
}
