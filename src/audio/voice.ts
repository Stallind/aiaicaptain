import { FORMANT_UPDATE_INTERVAL } from '../config/audio';
import { createRng } from '../utils/random';
import type { Formants, VoiceSound } from './types';

/** Relative loudness of the three formants; higher ones are quieter in real voices. */
const FORMANT_GAINS: Formants = [1, 0.6, 0.3];
/** Width of each formant in hertz. Narrow enough to colour the sound as a vowel. */
const FORMANT_BANDWIDTHS: Formants = [90, 110, 140];
/** Fade in/out of the vowel, in seconds, so it starts and stops like a voice rather than a click. */
const VOWEL_EDGE = { attack: 0.02, release: 0.06 } as const;
const CONSONANT_Q = 1.5;
const NOISE_SEED = 11;

/** A biquad band-pass filter (RBJ cookbook, 0 dB peak) whose centre can glide. */
export class BandPass {
  private b0 = 0;
  private b2 = 0;
  private a1 = 0;
  private a2 = 0;
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;

  constructor(private readonly sampleRate: number) {}

  tune(centerHz: number, q: number): void {
    const w0 = (2 * Math.PI * centerHz) / this.sampleRate;
    const alpha = Math.sin(w0) / (2 * q);
    const a0 = 1 + alpha;
    this.b0 = alpha / a0;
    this.b2 = -alpha / a0;
    this.a1 = (-2 * Math.cos(w0)) / a0;
    this.a2 = (1 - alpha) / a0;
  }

  process(x: number): number {
    const y = this.b0 * x + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

/** Value of an evenly spaced contour at `t` (0..1), linearly interpolated. */
export function contourAt(points: readonly number[], t: number): number {
  if (points.length === 0) return 0;
  const position = Math.min(1, Math.max(0, t)) * (points.length - 1);
  const index = Math.floor(position);
  const from = points[index] ?? 0;
  const to = points[Math.min(index + 1, points.length - 1)] ?? from;
  return from + (to - from) * (position - index);
}

export function voiceLengthMs(sound: VoiceSound): number {
  const { consonant } = sound;
  return sound.vowel.durationMs + (consonant ? consonant.gapMs + consonant.durationMs : 0);
}

/**
 * Formant synthesis: a buzzing source at the voice's pitch, shaped by three
 * band-pass filters at the vowel's formants. Gliding the formants from one
 * vowel to another (a → u) makes the "ow" of "ouch"; a filtered noise burst makes the "ch".
 */
export function renderVoice(sound: VoiceSound, sampleRate: number): Float32Array<ArrayBuffer> {
  const out = new Float32Array(Math.round((voiceLengthMs(sound) / 1000) * sampleRate));
  renderVowel(out, sound.vowel, sampleRate);
  if (sound.consonant) renderConsonant(out, sound, sampleRate);
  return out;
}

function renderVowel(out: Float32Array, vowel: VoiceSound['vowel'], sampleRate: number): void {
  const length = Math.round((vowel.durationMs / 1000) * sampleRate);
  const filters = FORMANT_GAINS.map(() => new BandPass(sampleRate));
  let phase = 0;
  for (let i = 0; i < length && i < out.length; i++) {
    const t = i / length;
    if (i % FORMANT_UPDATE_INTERVAL === 0) {
      filters.forEach((filter, f) => {
        const hz = glide(vowel.from[f] ?? 0, vowel.to[f] ?? 0, t);
        filter.tune(hz, hz / (FORMANT_BANDWIDTHS[f] ?? hz));
      });
    }
    phase = (phase + contourAt(vowel.pitchHz, t) / sampleRate) % 1;
    // A sawtooth is rich in harmonics, which the formant filters need to shape a vowel.
    const source = 2 * phase - 1;
    let sample = 0;
    filters.forEach((filter, f) => {
      sample += filter.process(source) * (FORMANT_GAINS[f] ?? 0);
    });
    out[i] = sample * edgeFade(i / sampleRate, length / sampleRate);
  }
}

function renderConsonant(out: Float32Array, sound: VoiceSound, sampleRate: number): void {
  const consonant = sound.consonant;
  if (!consonant) return;
  const start = Math.round(((sound.vowel.durationMs + consonant.gapMs) / 1000) * sampleRate);
  const length = Math.round((consonant.durationMs / 1000) * sampleRate);
  const filter = new BandPass(sampleRate);
  filter.tune(consonant.centerHz, CONSONANT_Q);
  const random = createRng(NOISE_SEED);
  for (let i = 0; i < length && start + i < out.length; i++) {
    const t = i / length;
    // Sharp onset, then a fade: the release of "t" into "sh".
    const level = Math.min(1, t * 20) * (1 - t);
    out[start + i] = filter.process(random() * 2 - 1) * level * consonant.volume;
  }
}

/** Glides with an ease-in-out, so the vowel lingers at both ends like speech. */
function glide(from: number, to: number, t: number): number {
  const eased = t * t * (3 - 2 * t);
  return from + (to - from) * eased;
}

function edgeFade(t: number, duration: number): number {
  return Math.min(1, t / VOWEL_EDGE.attack, (duration - t) / VOWEL_EDGE.release);
}
