/// The single seam between the game and durable storage.
///
/// Everything lives in localStorage today. If this ever needs to sync across
/// devices, this module is the only thing that changes — the engine and the
/// screens never touch storage directly.
///
/// Safari in private mode throws on write, and localStorage is absent during
/// server rendering, so both paths degrade to in-memory silently.

export const ROSTER_KEY = 'imposter.roster.v1';
export const SETTINGS_KEY = 'imposter.settings.v1';

export function load<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

export function save<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or private mode. The game plays fine without persistence.
  }
}

export function remove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to do.
  }
}
