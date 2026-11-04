/** Playback and synthesis settings. The sounds themselves are data in src/content/audio/. */
export const AUDIO = {
  /** 0..1 of full volume. */
  musicVolume: 0.15,
  effectsVolume: 0.3,
  /** Low enough to render quickly at boot, high enough for the "ch" hiss of "Ouch!". */
  sampleRate: 22050,
  /**
   * Every sound is scaled so its loudest stretch has this loudness (RMS), so the
   * volume sliders mean the same for a beep as for the music. Scaling by peak
   * instead made short square-wave effects far louder than the music.
   */
  loudness: 0.25,
  /** Length of the stretch loudness is measured over, in seconds. */
  loudnessWindow: 0.1,
  /** No sample goes above this, so mixing several sounds never clips. */
  peak: 0.9,
} as const;

/** Envelope shared by all synthesized notes, in seconds. */
export const NOTE_ENVELOPE = {
  attack: 0.003,
  decay: 0.08,
  /** Level held after the decay, 0..1. */
  sustain: 0.6,
  /** Fade at the end of every note, so notes don't click. */
  release: 0.02,
} as const;

/** Drum hits for the noise voice, in seconds and hertz. */
export const DRUMS = {
  kick: { duration: 0.14, startHz: 150, endHz: 45 },
  snare: { duration: 0.12, toneHz: 190, toneMix: 0.3 },
  hat: { duration: 0.035 },
  /** The noise voice is seeded, so every boot renders the same drums. */
  noiseSeed: 7,
} as const;

/** Formant filters are recomputed this often (in samples) while their frequencies glide. */
export const FORMANT_UPDATE_INTERVAL = 32;

/** Which registered sound plays for what. The sounds are listed in SOUNDS in src/content/registry.ts. */
export const SOUND_IDS = {
  music: 'theme',
  hurt: 'ouch',
  levelComplete: 'level-complete',
  stomp: 'stomp',
  pickup: 'pickup',
  death: 'death',
} as const;
