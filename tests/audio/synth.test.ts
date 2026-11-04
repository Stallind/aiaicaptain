import { describe, expect, it } from 'vitest';
import { noteFrequency, drumHit } from '../../src/audio/notes';
import { loudestRms, normalizeLoudness, renderSound } from '../../src/audio/render';
import { envelopeAt, noteEvents, renderTrack, samplesPerStep } from '../../src/audio/track';
import type { TrackSound, VoiceSound } from '../../src/audio/types';
import { validateSound } from '../../src/audio/validateSound';
import { BandPass, contourAt, renderVoice, voiceLengthMs } from '../../src/audio/voice';

const RATE = 22050;

function track(steps: string, waveform: 'square' | 'triangle' | 'drums' = 'square'): TrackSound {
  return {
    kind: 'track',
    id: 't',
    bpm: 120,
    stepsPerBeat: 4,
    voices: [{ waveform, volume: 1, steps }],
  };
}

const peakOf = (samples: Float32Array): number => Math.max(...samples.map(Math.abs));

describe('notes', () => {
  it('tunes A4 to 440 Hz and spaces octaves by a factor of two', () => {
    expect(noteFrequency('A4')).toBe(440);
    expect(noteFrequency('A5')).toBeCloseTo(880);
    expect(noteFrequency('C4')).toBeCloseTo(261.63, 1);
    expect(noteFrequency('C#4')).toBeCloseTo(noteFrequency('Db4') ?? 0);
  });

  it('rejects anything that is not a note', () => {
    for (const token of ['H4', 'A', 'a4', 'A9', '.', '']) expect(noteFrequency(token)).toBeNull();
    expect(drumHit('k')).toBe('kick');
    expect(drumHit('x')).toBeNull();
  });
});

describe('track rendering', () => {
  it('joins held steps onto the note before them, and rests end a note', () => {
    expect(noteEvents('A4 . . - C5 .')).toEqual([
      { step: 0, length: 3, frequency: 440 },
      { step: 4, length: 2, frequency: noteFrequency('C5') },
    ]);
  });

  it('is exactly one step grid long, so the music loops in time', () => {
    const sound = track('A4 . - C5');
    expect(renderTrack(sound, RATE)).toHaveLength(4 * samplesPerStep(sound, RATE));
  });

  it('is silent where every voice rests', () => {
    expect(peakOf(renderTrack(track('- - - -'), RATE))).toBe(0);
    expect(peakOf(renderTrack(track('- . - .', 'drums'), RATE))).toBe(0);
  });

  it('makes sound for notes and drum hits', () => {
    expect(peakOf(renderTrack(track('A4 . . .'), RATE))).toBeGreaterThan(0.1);
    expect(peakOf(renderTrack(track('A2 . . .', 'triangle'), RATE))).toBeGreaterThan(0.1);
    expect(peakOf(renderTrack(track('k s h -', 'drums'), RATE))).toBeGreaterThan(0.1);
  });

  it('fades every note in and out, so notes do not click', () => {
    expect(envelopeAt(0, 1)).toBe(0);
    expect(envelopeAt(0.5, 1)).toBeGreaterThan(0.5);
    expect(envelopeAt(1, 1)).toBe(0);
  });
});

describe('voice rendering', () => {
  const voice: VoiceSound = {
    kind: 'voice',
    id: 'v',
    vowel: { durationMs: 200, pitchHz: [300, 200], from: [780, 1250, 2600], to: [360, 760, 2400] },
    consonant: { gapMs: 30, durationMs: 100, centerHz: 3200, volume: 0.6 },
  };

  it('lasts the vowel, the gap and the consonant', () => {
    expect(voiceLengthMs(voice)).toBe(330);
    expect(renderVoice(voice, RATE)).toHaveLength(Math.round(0.33 * RATE));
  });

  it('is silent in the gap between vowel and consonant', () => {
    const samples = renderVoice(voice, RATE);
    const gap = samples.slice(Math.round(0.205 * RATE), Math.round(0.225 * RATE));
    expect(peakOf(gap)).toBe(0);
  });

  it('follows a pitch contour', () => {
    expect(contourAt([300, 200], 0)).toBe(300);
    expect(contourAt([300, 200], 0.5)).toBe(250);
    expect(contourAt([300, 360, 200], 1)).toBe(200);
  });

  it('band-pass passes its centre frequency and damps far-away ones', () => {
    const response = (hz: number): number => {
      const filter = new BandPass(RATE);
      filter.tune(1000, 2);
      let peak = 0;
      for (let i = 0; i < RATE / 10; i++) {
        const y = filter.process(Math.sin((2 * Math.PI * hz * i) / RATE));
        if (i > RATE / 20) peak = Math.max(peak, Math.abs(y));
      }
      return peak;
    };
    expect(response(1000)).toBeGreaterThan(0.9);
    expect(response(100)).toBeLessThan(0.2);
  });
});

describe('loudness', () => {
  const target = { rms: 0.25, windowSamples: 4, peak: 0.9 };

  it('measures the loudest stretch, not the average', () => {
    const quietThenLoud = new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0.5, -0.5, 0.5, -0.5]);
    expect(loudestRms(quietThenLoud, 4)).toBeCloseTo(0.5);
  });

  it('brings a loud square wave and a quiet tone to the same loudness', () => {
    const loud = new Float32Array(400).map((_, i) => (i % 20 < 10 ? 0.9 : -0.9));
    const quiet = new Float32Array(400).map((_, i) => 0.1 * Math.sin(i / 3));
    normalizeLoudness(loud, { ...target, windowSamples: 100 });
    normalizeLoudness(quiet, { ...target, windowSamples: 100 });
    expect(loudestRms(loud, 100)).toBeCloseTo(0.25);
    expect(loudestRms(quiet, 100)).toBeCloseTo(0.25);
  });

  it('never goes above the peak, and leaves silence alone', () => {
    const spike = new Float32Array([0, 0, 0.01, 0, 0, 0, 0, 0]);
    spike[2] = 0.01;
    normalizeLoudness(spike, { rms: 10, windowSamples: 4, peak: 0.9 });
    expect(peakOf(spike)).toBeCloseTo(0.9);
    const silence = new Float32Array(8);
    normalizeLoudness(silence, target);
    expect([...silence]).toEqual(Array(8).fill(0));
  });

  it('makes a sound with a lower level quieter', () => {
    const full = renderSound(track('A4 C5 E5 .'), RATE);
    const half = renderSound({ ...track('A4 C5 E5 .'), level: 0.5 }, RATE);
    const window = Math.round(RATE / 10);
    expect(loudestRms(half, window)).toBeCloseTo(loudestRms(full, window) / 2, 3);
  });
});

describe('validateSound', () => {
  it('names the voice and step of an unknown token', () => {
    expect(validateSound(track('A4 X9 .'), RATE)).toEqual([
      'Sound "t" voice 1 (square) step 2: unknown token "X9", expected a note like A4 or C#5, . or -.',
    ]);
    expect(validateSound(track('k A4', 'drums'), RATE)[0]).toMatch(/step 2.*expected k, s, h/);
  });

  it('requires voices of equal length, a tempo and sane volumes', () => {
    const uneven: TrackSound = {
      ...track('A4 .'),
      bpm: 0,
      voices: [
        { waveform: 'square', volume: 1, steps: 'A4 .' },
        { waveform: 'square', volume: 2, duty: 1, steps: 'A4' },
      ],
    };
    const errors = validateSound(uneven, RATE).join('\n');
    expect(errors).toMatch(/bpm must be above 0/);
    expect(errors).toMatch(/same number of steps, got 2, 1/);
    expect(errors).toMatch(/voice 2 .*volume must be 0..1/);
    expect(errors).toMatch(/duty must be between 0 and 1/);
    expect(validateSound({ ...track('A4'), level: 2 }, RATE)).toEqual([
      'Sound "t": level must be above 0 and at most 1, got 2.',
    ]);
  });

  it('rejects formants above half the sample rate, which cannot be played', () => {
    const voice: VoiceSound = {
      kind: 'voice',
      id: 'v',
      vowel: { durationMs: 100, pitchHz: [200], from: [500, 1500, 12000], to: [500, 1500, 2500] },
    };
    expect(validateSound(voice, RATE)).toEqual([
      'Sound "v": 12000 Hz must be above 0 and below 11025 Hz (half the sample rate).',
    ]);
  });
});
