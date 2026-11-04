import { AUDIO } from '../config/audio';
import { renderTrack } from './track';
import type { SoundDefinition } from './types';
import { renderVoice } from './voice';

/** RMS of the loudest stretch of `window` samples, measured every quarter window. */
export function loudestRms(samples: Float32Array, window: number): number {
  const length = Math.max(1, Math.min(window, samples.length));
  const hop = Math.max(1, Math.round(length / 4));
  let loudest = 0;
  for (let start = 0; start + length <= samples.length; start += hop) {
    let energy = 0;
    for (let i = start; i < start + length; i++) energy += (samples[i] ?? 0) ** 2;
    loudest = Math.max(loudest, Math.sqrt(energy / length));
  }
  return loudest;
}

export interface LoudnessTarget {
  /** RMS the loudest stretch is scaled to. */
  readonly rms: number;
  readonly windowSamples: number;
  /** No sample may exceed this; quieter results are accepted over clipping. */
  readonly peak: number;
}

/** Scales samples in place to the target loudness, capped by the peak. Silence stays silent. */
export function normalizeLoudness(samples: Float32Array, target: LoudnessTarget): void {
  const rms = loudestRms(samples, target.windowSamples);
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  if (rms === 0 || peak === 0) return;
  const gain = Math.min(target.rms / rms, target.peak / peak);
  for (let i = 0; i < samples.length; i++) samples[i] = (samples[i] ?? 0) * gain;
}

/** Renders any sound definition to mono samples at a common loudness, times its own level. */
export function renderSound(sound: SoundDefinition, sampleRate: number): Float32Array<ArrayBuffer> {
  const samples =
    sound.kind === 'track' ? renderTrack(sound, sampleRate) : renderVoice(sound, sampleRate);
  const level = sound.level ?? 1;
  normalizeLoudness(samples, {
    rms: AUDIO.loudness * level,
    windowSamples: Math.round(AUDIO.loudnessWindow * sampleRate),
    peak: AUDIO.peak,
  });
  return samples;
}
