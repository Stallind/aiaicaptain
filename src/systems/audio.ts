import Phaser from 'phaser';
import { renderSound } from '../audio/render';
import { AUDIO, SOUND_IDS } from '../config/audio';
import { SOUNDS } from '../content/registry';
import type { AudioSettings } from '../utils/audioSettings';
import { storageOf } from './sharedStorage';

/**
 * Renders every registered sound into Phaser's audio cache, once at boot.
 * Without Web Audio (very old browsers) the game simply runs silent: every
 * play call below checks the cache first.
 */
export function registerSounds(scene: Phaser.Scene): void {
  const manager = scene.sound;
  if (!(manager instanceof Phaser.Sound.WebAudioSoundManager)) return;
  for (const sound of SOUNDS) {
    try {
      const samples = renderSound(sound, AUDIO.sampleRate);
      const buffer = manager.context.createBuffer(1, samples.length, AUDIO.sampleRate);
      buffer.copyToChannel(samples, 0);
      scene.cache.audio.add(sound.id, buffer);
    } catch (error) {
      // A missing sound must not stop the game from starting.
      console.warn(`Sound "${sound.id}" could not be created and will be silent.`, error);
    }
  }
  applyAudioSettings(scene, storageOf(scene).getAudioSettings());
}

/** Applies settings to the running game: mute, and the volume of music already playing. */
export function applyAudioSettings(
  scene: Phaser.Scene,
  settings: AudioSettings,
  music: Phaser.Sound.BaseSound | null = scene.sound.get(SOUND_IDS.music),
): void {
  scene.sound.mute = settings.muted;
  if (music instanceof Phaser.Sound.WebAudioSound) music.setVolume(settings.music);
}

/** Starts the soundtrack unless it is already playing. It keeps playing across scenes. */
export function startMusic(scene: Phaser.Scene): void {
  if (!scene.cache.audio.exists(SOUND_IDS.music)) return;
  const existing = scene.sound.get(SOUND_IDS.music);
  if (existing?.isPlaying) return;
  const music = existing ?? scene.sound.add(SOUND_IDS.music, { loop: true });
  // The same path the settings screen uses, so the saved volume and mute apply from the first note.
  applyAudioSettings(scene, storageOf(scene).getAudioSettings(), music);
  music.play();
}

export function stopMusic(scene: Phaser.Scene): void {
  scene.sound.get(SOUND_IDS.music)?.stop();
}

/** Plays a one-off sound effect at the chosen effects volume. */
export function playEffect(scene: Phaser.Scene, id: string): void {
  if (!scene.cache.audio.exists(id)) return;
  scene.sound.play(id, { volume: storageOf(scene).getAudioSettings().effects });
}
