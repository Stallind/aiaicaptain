import { HOLD, REST, drumHit, noteFrequency, splitSteps } from './notes';
import type { SoundDefinition, TrackSound, VoiceSound } from './types';

/** Problems with a sound definition, each naming the sound, voice and step. Empty when valid. */
export function validateSound(sound: SoundDefinition, sampleRate: number): string[] {
  const errors = sound.kind === 'track' ? trackErrors(sound) : voiceErrors(sound, sampleRate);
  if (sound.level !== undefined && !(sound.level > 0 && sound.level <= 1)) {
    errors.push(`Sound "${sound.id}": level must be above 0 and at most 1, got ${sound.level}.`);
  }
  return errors;
}

function trackErrors(track: TrackSound): string[] {
  const errors: string[] = [];
  const where = `Sound "${track.id}"`;
  if (!(track.bpm > 0)) errors.push(`${where}: bpm must be above 0, got ${track.bpm}.`);
  if (!Number.isInteger(track.stepsPerBeat) || track.stepsPerBeat < 1) {
    errors.push(`${where}: stepsPerBeat must be a whole number of at least 1.`);
  }
  if (track.voices.length === 0) errors.push(`${where}: has no voices.`);
  const lengths = new Set(track.voices.map((voice) => splitSteps(voice.steps).length));
  if (lengths.size > 1) {
    errors.push(
      `${where}: all voices must have the same number of steps, got ${[...lengths].join(', ')}.`,
    );
  }
  track.voices.forEach((voice, index) => {
    const label = `${where} voice ${index + 1} (${voice.waveform})`;
    if (!(voice.volume >= 0 && voice.volume <= 1)) errors.push(`${label}: volume must be 0..1.`);
    if (voice.duty !== undefined && !(voice.duty > 0 && voice.duty < 1)) {
      errors.push(`${label}: duty must be between 0 and 1.`);
    }
    splitSteps(voice.steps).forEach((token, step) => {
      if (!isValidToken(token, voice.waveform === 'drums')) {
        const expected =
          voice.waveform === 'drums' ? 'k, s, h, . or -' : 'a note like A4 or C#5, . or -';
        errors.push(`${label} step ${step + 1}: unknown token "${token}", expected ${expected}.`);
      }
    });
  });
  return errors;
}

function isValidToken(token: string, drums: boolean): boolean {
  if (token === HOLD || token === REST) return true;
  return drums ? drumHit(token) !== null : noteFrequency(token) !== null;
}

function voiceErrors(sound: VoiceSound, sampleRate: number): string[] {
  const errors: string[] = [];
  const where = `Sound "${sound.id}"`;
  const nyquist = sampleRate / 2;
  if (!(sound.vowel.durationMs > 0)) errors.push(`${where}: vowel duration must be above 0.`);
  if (sound.vowel.pitchHz.length === 0 || sound.vowel.pitchHz.some((hz) => !(hz > 0))) {
    errors.push(`${where}: pitchHz needs at least one frequency, all above 0.`);
  }
  for (const hz of [...sound.vowel.from, ...sound.vowel.to, sound.consonant?.centerHz ?? 1]) {
    if (!(hz > 0 && hz < nyquist)) {
      errors.push(
        `${where}: ${hz} Hz must be above 0 and below ${nyquist} Hz (half the sample rate).`,
      );
    }
  }
  const consonant = sound.consonant;
  if (consonant && !(consonant.durationMs > 0 && consonant.gapMs >= 0)) {
    errors.push(`${where}: consonant needs a duration above 0 and a gap of 0 or more.`);
  }
  return errors;
}
