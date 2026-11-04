/** Sounds are data, like sprites. src/audio/ renders them to samples at boot. */

export type Waveform = 'square' | 'triangle' | 'drums';

export interface VoiceDefinition {
  readonly waveform: Waveform;
  /** 0..1 share of each square-wave cycle spent high; 0.25 and 0.125 sound thinner, more "8-bit". */
  readonly duty?: number;
  /** Mix level of this voice, 0..1. */
  readonly volume: number;
  /**
   * One token per step, separated by whitespace:
   * - a note such as `A4`, `C#5` or `Bb3` starts that note;
   * - `.` holds the previous note (or rest);
   * - `-` is a rest;
   * - drum voices use `k` (kick), `s` (snare) and `h` (hi-hat) instead of notes.
   */
  readonly steps: string;
}

/** A tune made of voices that play together on a step grid. */
export interface TrackSound {
  readonly kind: 'track';
  readonly id: string;
  /** Loudness relative to other sounds, 0..1 (default 1). Frequent sounds such as jumps sit lower. */
  readonly level?: number;
  readonly bpm: number;
  /** Steps per beat; 4 makes every step a sixteenth note. */
  readonly stepsPerBeat: number;
  readonly voices: readonly VoiceDefinition[];
}

/** Three vocal-tract resonances in hertz: they decide which vowel is heard. */
export type Formants = readonly [number, number, number];

/** A short synthesized "voice": a vowel that glides, optionally ending in a hissed consonant. */
export interface VoiceSound {
  readonly kind: 'voice';
  readonly id: string;
  /** Loudness relative to other sounds, 0..1 (default 1). */
  readonly level?: number;
  readonly vowel: {
    readonly durationMs: number;
    /** Pitch contour: hertz at evenly spaced points across the vowel. */
    readonly pitchHz: readonly number[];
    /** Formants at the start and the end of the vowel; they glide in between. */
    readonly from: Formants;
    readonly to: Formants;
  };
  /** A noise burst after a short silence, such as the "ch" in "ouch". */
  readonly consonant?: {
    readonly gapMs: number;
    readonly durationMs: number;
    readonly centerHz: number;
    readonly volume: number;
  };
}

export type SoundDefinition = TrackSound | VoiceSound;
