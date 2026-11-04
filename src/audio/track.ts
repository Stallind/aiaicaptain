import { DRUMS, NOTE_ENVELOPE } from '../config/audio';
import { createRng } from '../utils/random';
import { HOLD, REST, drumHit, noteFrequency, splitSteps } from './notes';
import type { DrumHit } from './notes';
import type { TrackSound, VoiceDefinition } from './types';

interface NoteEvent {
  readonly step: number;
  length: number;
  readonly frequency: number;
}

interface DrumEvent {
  readonly step: number;
  readonly hit: DrumHit;
}

/** Samples per step at this tempo. */
export function samplesPerStep(track: TrackSound, sampleRate: number): number {
  return Math.round((sampleRate * 60) / track.bpm / track.stepsPerBeat);
}

export function stepCount(track: TrackSound): number {
  return Math.max(0, ...track.voices.map((voice) => splitSteps(voice.steps).length));
}

/** Renders every voice of a track into one mono buffer, one step grid long. */
export function renderTrack(track: TrackSound, sampleRate: number): Float32Array<ArrayBuffer> {
  const stepSamples = samplesPerStep(track, sampleRate);
  const out = new Float32Array(stepCount(track) * stepSamples);
  for (const voice of track.voices) {
    if (voice.waveform === 'drums') renderDrums(out, voice, stepSamples, sampleRate);
    else renderTones(out, voice, stepSamples, sampleRate);
  }
  return out;
}

/** Turns tokens into notes, joining held steps onto the note before them. */
export function noteEvents(steps: string): NoteEvent[] {
  const events: NoteEvent[] = [];
  let current: NoteEvent | null = null;
  splitSteps(steps).forEach((token, step) => {
    if (token === HOLD) {
      if (current) current.length++;
      return;
    }
    const frequency = token === REST ? null : noteFrequency(token);
    current = frequency === null ? null : { step, length: 1, frequency };
    if (current) events.push(current);
  });
  return events;
}

function drumEvents(steps: string): DrumEvent[] {
  const events: DrumEvent[] = [];
  splitSteps(steps).forEach((token, step) => {
    const hit = drumHit(token);
    if (hit) events.push({ step, hit });
  });
  return events;
}

/** Note loudness at `t` seconds into a note lasting `duration` seconds. */
export function envelopeAt(t: number, duration: number): number {
  const { attack, decay, sustain, release } = NOTE_ENVELOPE;
  let level: number;
  if (t < attack) level = t / attack;
  else if (t < attack + decay) level = 1 - ((t - attack) / decay) * (1 - sustain);
  else level = sustain;
  const untilEnd = duration - t;
  return untilEnd < release ? level * Math.max(0, untilEnd / release) : level;
}

function oscillator(waveform: VoiceDefinition['waveform'], phase: number, duty: number): number {
  if (waveform === 'triangle') return 4 * Math.abs(phase - 0.5) - 1;
  return phase < duty ? 1 : -1;
}

function renderTones(
  out: Float32Array,
  voice: VoiceDefinition,
  stepSamples: number,
  sampleRate: number,
): void {
  const duty = voice.duty ?? 0.5;
  for (const note of noteEvents(voice.steps)) {
    const start = note.step * stepSamples;
    const length = note.length * stepSamples;
    const duration = length / sampleRate;
    const increment = note.frequency / sampleRate;
    let phase = 0;
    for (let i = 0; i < length && start + i < out.length; i++) {
      const sample = oscillator(voice.waveform, phase, duty);
      out[start + i] =
        (out[start + i] ?? 0) + sample * envelopeAt(i / sampleRate, duration) * voice.volume;
      phase = (phase + increment) % 1;
    }
  }
}

function renderDrums(
  out: Float32Array,
  voice: VoiceDefinition,
  stepSamples: number,
  sampleRate: number,
): void {
  const random = createRng(DRUMS.noiseSeed);
  const noise = (): number => random() * 2 - 1;
  for (const { step, hit } of drumEvents(voice.steps)) {
    const start = step * stepSamples;
    const length = Math.round(DRUMS[hit].duration * sampleRate);
    let phase = 0;
    let previousNoise = 0;
    for (let i = 0; i < length && start + i < out.length; i++) {
      const t = i / length;
      const fade = (1 - t) ** 2;
      let sample: number;
      if (hit === 'kick') {
        const hz = DRUMS.kick.startHz + (DRUMS.kick.endHz - DRUMS.kick.startHz) * Math.sqrt(t);
        phase = (phase + hz / sampleRate) % 1;
        sample = Math.sin(phase * 2 * Math.PI);
      } else if (hit === 'snare') {
        phase = (phase + DRUMS.snare.toneHz / sampleRate) % 1;
        const tone = Math.sin(phase * 2 * Math.PI) * DRUMS.snare.toneMix;
        sample = noise() * (1 - DRUMS.snare.toneMix) + tone;
      } else {
        // The difference of two noise samples keeps only the high hiss of a hi-hat.
        const current = noise();
        sample = (current - previousNoise) / 2;
        previousNoise = current;
      }
      out[start + i] = (out[start + i] ?? 0) + sample * fade * voice.volume;
    }
  }
}
