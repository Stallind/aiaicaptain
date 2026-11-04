import type { TrackSound } from '../../audio/types';

/**
 * "Captain's Orbit": an original 16-bar chiptune loop in A minor, 132 bpm.
 *
 * Bars 1–8 build up: voices join one by one, the arpeggio doubles its speed,
 * the lead climbs a scale and the snare rolls faster, then half a beat of silence.
 * Bars 9–16 are the drop: a growling square-wave bass jumping octaves, four-on-
 * the-floor kick, and the melody as the hook. The loop then falls back into the build.
 *
 * Every bar is 16 sixteenth-note steps. Chords per 8 bars: Am F C G Am F G E.
 */

type Chord = readonly [string, string, string];

const CHORDS: readonly Chord[] = [
  ['A4', 'C5', 'E5'],
  ['F4', 'A4', 'C5'],
  ['G4', 'C5', 'E5'],
  ['G4', 'B4', 'D5'],
  ['A4', 'C5', 'E5'],
  ['F4', 'A4', 'C5'],
  ['G4', 'B4', 'D5'],
  ['G#4', 'B4', 'E5'],
];
const ROOTS = ['A', 'F', 'C', 'G', 'A', 'F', 'G', 'E'];

const REST_BAR = '- . . . . . . . . . . . . . . .';
const repeat = (bar: string, times: number): string[] => Array.from({ length: times }, () => bar);
const join = (bars: readonly string[]): string => bars.join(' ');

// ---- Build-up -------------------------------------------------------------

/** Broken chord in eighth notes: calm. */
function slowArpeggio([low, middle, high]: Chord): string {
  return join(repeat(`${low} . ${middle} . ${high} . ${middle} .`, 2));
}

/** Broken chord in sixteenth notes: twice the energy. */
function fastArpeggio([low, middle, high]: Chord): string {
  return join(repeat(`${low} ${middle} ${high} ${middle}`, 4));
}

const BUILD_LEAD = [
  REST_BAR,
  REST_BAR,
  REST_BAR,
  REST_BAR,
  'E5 . . . . . . . A5 . . . G5 . . .',
  'F5 . . . . . . . E5 . . . C5 . . .',
  // The riser: up the A minor scale in eighths...
  'A3 . B3 . C4 . D4 . E4 . F4 . G4 . A4 .',
  // ...then sixteenths, and a breath before the drop.
  'B4 C5 D5 E5 B4 C5 D5 E5 C5 D5 E5 F5 E5 . - .',
];

const BUILD_BASS = [
  REST_BAR,
  REST_BAR,
  REST_BAR,
  REST_BAR,
  'A2 . . . . . . . . . . . . . . .',
  'F2 . . . . . . . . . . . . . . .',
  join(repeat('G2 . G2 .', 4)),
  'E2 . E2 . E2 . E2 . E2 . E2 . E2 . - .',
];

const BUILD_DRUMS = [
  '- - h - - - h - - - h - - - h -',
  '- - h - - - h - - - h - - - h -',
  'k - h - - - h - k - h - - - h -',
  'k - h - - - h - k - h - - - h -',
  'k - h - k - h - k - h - k - h -',
  'k - h - k - h - k - h - k - h h',
  // Snare roll: eighths, then sixteenths.
  'k - s - k - s - s - s - s - s -',
  's s s s s s s s s s s s s s - -',
];

// ---- Drop -----------------------------------------------------------------

/** The 8-bit bass: low root jumping up an octave in a syncopated pattern. */
function dropBass(root: string): string {
  const lo = `${root}1`;
  const hi = `${root}2`;
  return `${lo} . ${hi} ${lo} - ${lo} ${hi} . ${lo} . ${hi} ${lo} - ${lo} ${hi} ${hi}`;
}

/** Triangle sub-bass under it, for weight. */
const subBass = (root: string): string => `${root}2 . . . . . . . ${root}2 . . . . . . .`;

const HOOK = [
  'E5 . . . A5 . . . G5 . E5 . D5 . C5 .',
  'D5 . . . C5 . A4 . C5 . . . - . . .',
  'E5 . G5 . C6 . . . B5 . G5 . E5 . G5 .',
  'D5 . . . . . . . B4 . D5 . G5 . . .',
  'A5 . . . C6 . B5 . A5 . E5 . . . A4 .',
  'F5 . . . E5 . D5 . C5 . . . A4 . C5 .',
  'D5 . . . G5 . . . B5 . . . D6 . . .',
  'E5 . G#5 . B5 . . . E6 . . . - . . .',
];

const DROP_KICKS = 'k - - - s - - - k - - - s - k -';
const DROP_FILL = 'k - - - s - - - k - s s s s s s';
const DROP_HATS = '- - h - - h h - - - h - - h h h';

// ---- Voices ---------------------------------------------------------------

export const theme: TrackSound = {
  kind: 'track',
  id: 'theme',
  bpm: 132,
  stepsPerBeat: 4,
  voices: [
    // Lead: a quieter riser in the build, then the hook at full strength in the drop.
    {
      waveform: 'square',
      duty: 0.25,
      volume: 0.17,
      steps: join([...BUILD_LEAD, ...repeat(REST_BAR, 8)]),
    },
    {
      waveform: 'square',
      duty: 0.25,
      volume: 0.3,
      steps: join([...repeat(REST_BAR, 8), ...HOOK]),
    },
    // Arpeggio: slow for 4 bars, fast from bar 5 on.
    {
      waveform: 'square',
      duty: 0.5,
      volume: 0.07,
      steps: join([
        ...CHORDS.slice(0, 4).map(slowArpeggio),
        ...CHORDS.slice(4, 7).map(fastArpeggio),
        // Bar 8 stops with everything else, for the breath before the drop.
        'G#4 B4 E5 B4 G#4 B4 E5 B4 G#4 B4 E5 B4 G#4 B4 - .',
        ...CHORDS.map(fastArpeggio),
      ]),
    },
    // Bass: a soft triangle in the build, then the sub under the drop's square bass.
    {
      waveform: 'triangle',
      volume: 0.22,
      steps: join([...BUILD_BASS, ...repeat(REST_BAR, 8)]),
    },
    {
      waveform: 'triangle',
      volume: 0.4,
      steps: join([...repeat(REST_BAR, 8), ...ROOTS.map(subBass)]),
    },
    {
      waveform: 'square',
      duty: 0.5,
      volume: 0.22,
      steps: join([...repeat(REST_BAR, 8), ...ROOTS.map(dropBass)]),
    },
    // Drums: lighter in the build so the drop hits harder, and a separate hi-hat
    // voice so a kick and a hi-hat can land on the same step.
    { waveform: 'drums', volume: 0.2, steps: join([...BUILD_DRUMS, ...repeat(REST_BAR, 8)]) },
    {
      waveform: 'drums',
      volume: 0.35,
      steps: join([...repeat(REST_BAR, 8), ...repeat(DROP_KICKS, 7), DROP_FILL]),
    },
    {
      waveform: 'drums',
      volume: 0.18,
      steps: join([...repeat(REST_BAR, 8), ...repeat(DROP_HATS, 8)]),
    },
  ],
};
