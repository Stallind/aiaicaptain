/** What the player chose on the sound settings screen. Volumes are 0..1. */
export interface AudioSettings {
  readonly music: number;
  readonly effects: number;
  /** "No sound": everything silent, whatever the volumes. */
  readonly muted: boolean;
}

/** Sliders move in steps of this size, so 0.1 means ten notches. */
export const VOLUME_STEP = 0.1;

function clampVolume(value: number): number {
  const snapped = Math.round(value / VOLUME_STEP) * VOLUME_STEP;
  // Rounding keeps 0.1 + 0.2 from becoming 0.30000000000000004 in storage and on screen.
  return Math.round(Math.min(1, Math.max(0, snapped)) * 100) / 100;
}

/** One notch up (+1) or down (-1), staying within 0..1. */
export function stepVolume(value: number, direction: 1 | -1): number {
  return clampVolume(value + direction * VOLUME_STEP);
}

/** Volume for a click or drag at `x` on a slider track starting at `left`. */
export function volumeAtPosition(x: number, left: number, width: number): number {
  if (!(width > 0)) return 0;
  return clampVolume((x - left) / width);
}

export function volumePercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function volumeOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? clampVolume(value) : fallback;
}

/**
 * Settings from storage are untrusted (see storage.ts): anything missing or
 * malformed falls back to the default, field by field.
 */
export function parseAudioSettings(raw: string | null, defaults: AudioSettings): AudioSettings {
  if (raw === null) return defaults;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return defaults;
  }
  if (typeof value !== 'object' || value === null) return defaults;
  const record = value as Record<string, unknown>;
  return {
    music: volumeOr(record['music'], defaults.music),
    effects: volumeOr(record['effects'], defaults.effects),
    muted: typeof record['muted'] === 'boolean' ? record['muted'] : defaults.muted,
  };
}
