import type { TrackSound, VoiceSound } from '../../audio/types';

/**
 * "Ouch!" as a synthesized voice: the vowel glides from "ah" to "oo" (the "ow"),
 * a short stop for the "t", then a hiss for the "sh". The pitch jumps up and
 * falls, like a startled shout.
 */
export const ouch: VoiceSound = {
  kind: 'voice',
  id: 'ouch',
  vowel: {
    durationMs: 260,
    pitchHz: [300, 360, 330, 260, 210],
    // Typical formants of "ah" and "oo".
    from: [780, 1250, 2600],
    to: [360, 760, 2400],
  },
  consonant: { gapMs: 35, durationMs: 140, centerHz: 3200, volume: 0.6 },
};

/** A rising fanfare for reaching the warp gate. */
export const levelComplete: TrackSound = {
  kind: 'track',
  id: 'level-complete',
  bpm: 150,
  stepsPerBeat: 4,
  voices: [
    {
      waveform: 'square',
      duty: 0.25,
      volume: 0.35,
      steps: 'G4 C5 E5 G5 C6 . . . B5 C6 D6 . E6 . . . . . . . . . . -',
    },
    {
      waveform: 'square',
      duty: 0.5,
      volume: 0.15,
      steps: 'E4 G4 C5 E5 G5 . . . G5 A5 B5 . C6 . . . . . . . . . . -',
    },
    {
      waveform: 'triangle',
      volume: 0.45,
      steps: 'C3 . . . C3 . . . G2 . . . C3 . . . . . . . . . . -',
    },
  ],
};

/** A quick downward "bop" with a thump, for landing on an enemy. */
export const stomp: TrackSound = {
  kind: 'track',
  id: 'stomp',
  bpm: 400,
  stepsPerBeat: 4,
  voices: [
    { waveform: 'square', duty: 0.5, volume: 0.4, steps: 'A5 E5 A4 . -' },
    { waveform: 'drums', volume: 0.5, steps: 'k - - - -' },
  ],
};

/**
 * A soft rising chime for stars and energy cells. Mostly triangle wave, which is
 * mellow, and kept below C6 so it doesn't get shrill when played many times.
 */
export const pickup: TrackSound = {
  kind: 'track',
  id: 'pickup',
  level: 0.6,
  bpm: 700,
  stepsPerBeat: 4,
  voices: [
    { waveform: 'triangle', volume: 0.6, steps: 'C5 E5 G5 C6 . -' },
    { waveform: 'square', duty: 0.5, volume: 0.12, steps: 'C5 E5 G5 C6 . -' },
  ],
};

// Jump sounds, one per captain (see jumpSound in each player definition).
// They play on every jump, so they are short and sit lower than the other effects.

/** AI Captain: two quick digital blips, like a bit flipping. */
export const jumpBits: TrackSound = {
  kind: 'track',
  id: 'jump-bits',
  level: 0.45,
  bpm: 900,
  stepsPerBeat: 4,
  voices: [{ waveform: 'square', duty: 0.25, volume: 0.5, steps: 'G4 . D5 . G5 . -' }],
};

/** Oh Scarrr: a short voiced "hup!", rising in pitch. */
export const jumpHup: VoiceSound = {
  kind: 'voice',
  id: 'jump-hup',
  level: 0.5,
  vowel: {
    durationMs: 120,
    pitchHz: [160, 210, 230],
    // Formants of "uh" closing toward "oo".
    from: [640, 1190, 2390],
    to: [450, 950, 2300],
  },
};

/** Spaiceman: a rocket-boot "bwoop" sweeping up, with jet hiss. */
export const jumpJet: TrackSound = {
  kind: 'track',
  id: 'jump-jet',
  level: 0.45,
  bpm: 900,
  stepsPerBeat: 4,
  voices: [
    { waveform: 'triangle', volume: 0.6, steps: 'C4 E4 G4 C5 E5 G5 . -' },
    { waveform: 'drums', volume: 0.25, steps: 'h h h h h h - -' },
  ],
};

/**
 * A slow chromatic slide down for losing the last life. It starts with a short
 * rest so the "Ouch!" of the final hit is heard first.
 */
export const death: TrackSound = {
  kind: 'track',
  id: 'death',
  // Long sustained notes feel louder than short effects at the same measured loudness,
  // and it follows straight after the final "Ouch!", so it sits well below the rest.
  level: 0.5,
  bpm: 140,
  stepsPerBeat: 4,
  voices: [
    {
      waveform: 'square',
      duty: 0.5,
      volume: 0.3,
      steps: '- - - - E5 . . Eb5 . . D5 . . Db5 . . . . . . C5 . . . . . . . . . . -',
    },
    {
      waveform: 'triangle',
      volume: 0.45,
      steps: '- - - - A3 . . . . . Ab3 . . . . . . . . . G3 . . . . . . . . . . -',
    },
  ],
};
