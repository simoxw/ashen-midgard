/**
 * Impostazioni di sistema persistenti (Audio, VFX, Controlli, Feedback aptico).
 * Completamente sicuro in ambienti headless/test senza DOM o localStorage.
 */

export const SETTINGS_STORAGE_KEY = 'ashen_midgard_settings_v1';

export const DEFAULT_SETTINGS = {
  masterVolume: 0.85,
  sfxVolume: 1.0,
  bgmVolume: 0.35,
  muted: false,
  vfxQuality: 'high', // 'high' | 'reduced'
  screenShake: true,
  damageNumbers: true,
  joystickMode: 'dynamic', // 'dynamic' | 'fixed'
  haptics: true
};

function clampUnit(val, fallback) {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

export function sanitizeSettings(raw = {}) {
  return {
    masterVolume: clampUnit(raw.masterVolume, DEFAULT_SETTINGS.masterVolume),
    sfxVolume: clampUnit(raw.sfxVolume, DEFAULT_SETTINGS.sfxVolume),
    bgmVolume: clampUnit(raw.bgmVolume, DEFAULT_SETTINGS.bgmVolume),
    muted: Boolean(raw.muted),
    vfxQuality: raw.vfxQuality === 'reduced' ? 'reduced' : 'high',
    screenShake: raw.screenShake !== undefined ? Boolean(raw.screenShake) : DEFAULT_SETTINGS.screenShake,
    damageNumbers: raw.damageNumbers !== undefined ? Boolean(raw.damageNumbers) : DEFAULT_SETTINGS.damageNumbers,
    joystickMode: raw.joystickMode === 'fixed' ? 'fixed' : 'dynamic',
    haptics: raw.haptics !== undefined ? Boolean(raw.haptics) : DEFAULT_SETTINGS.haptics
  };
}

export function loadSettings() {
  try {
    if (typeof localStorage === 'undefined') return { ...DEFAULT_SETTINGS };
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return sanitizeSettings(parsed);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  const normalized = sanitizeSettings(settings);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
    }
  } catch {
    // Ignora errori storage in navigazione privata
  }
  return normalized;
}

export function resetSettings() {
  return saveSettings({ ...DEFAULT_SETTINGS });
}

export function triggerHaptic(durationMs = 18, settings = null) {
  if (settings && !settings.haptics) return false;
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      return navigator.vibrate(durationMs);
    }
  } catch {
    // Ignora su device senza supporto vibrazione
  }
  return false;
}
