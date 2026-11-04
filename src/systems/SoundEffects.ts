import Phaser from 'phaser';
import { SOUND_IDS } from '../config/audio';
import type { EventBus, GameEventName } from '../events/EventBus';
import { playEffect, stopMusic } from './audio';

/** Which sound effect each game event plays. */
const EFFECT_FOR_EVENT: ReadonlyArray<readonly [GameEventName, string]> = [
  ['player:hurt', SOUND_IDS.hurt],
  ['level:completed', SOUND_IDS.levelComplete],
  ['enemy:stomped', SOUND_IDS.stomp],
  ['item:collected', SOUND_IDS.pickup],
  ['player:died', SOUND_IDS.death],
];

/** Plays the sound effects for game events, for as long as the scene runs. */
export function installSoundEffects(scene: Phaser.Scene, bus: EventBus): void {
  const listeners = EFFECT_FOR_EVENT.map(([event, sound]) => {
    const listener = (): void => playEffect(scene, sound);
    bus.on(event, listener);
    return [event, listener] as const;
  });
  // The music stops so the death tune is heard on its own; the menu starts it again.
  const onDied = (): void => stopMusic(scene);
  bus.on('player:died', onDied);
  // Each captain has its own jump sound, named in its character definition.
  const onJumped = ({ jumpSound }: { readonly jumpSound: string }): void =>
    playEffect(scene, jumpSound);
  bus.on('player:jumped', onJumped);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    for (const [event, listener] of listeners) bus.off(event, listener);
    bus.off('player:died', onDied);
    bus.off('player:jumped', onJumped);
  });
}
