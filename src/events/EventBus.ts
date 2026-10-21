import type Phaser from 'phaser';

export interface GameEvents {
  'score:changed': { readonly score: number };
  'health:changed': { readonly health: number; readonly max: number };
  /** Points were earned at a world position; used for score popups. */
  'points:awarded': { readonly points: number; readonly x: number; readonly y: number };
}

export type GameEventName = keyof GameEvents;

/** The part of Phaser's EventEmitter the bus uses; lets tests pass a plain fake. */
export interface Emitter {
  emit(event: string, ...args: unknown[]): unknown;
  on(event: string, fn: (...args: never[]) => void, context?: unknown): unknown;
  off(event: string, fn: (...args: never[]) => void, context?: unknown): unknown;
}

/**
 * Typed wrapper around the game-wide emitter. Every Phaser.Game has its own
 * emitter, so this is shared between scenes without being a global.
 */
export class EventBus {
  constructor(private readonly emitter: Emitter) {}

  static of(scene: Phaser.Scene): EventBus {
    return new EventBus(scene.game.events);
  }

  emit<K extends GameEventName>(event: K, payload: GameEvents[K]): void {
    this.emitter.emit(event, payload);
  }

  on<K extends GameEventName>(
    event: K,
    listener: (payload: GameEvents[K]) => void,
    context?: unknown,
  ): void {
    this.emitter.on(event, listener, context);
  }

  off<K extends GameEventName>(
    event: K,
    listener: (payload: GameEvents[K]) => void,
    context?: unknown,
  ): void {
    this.emitter.off(event, listener, context);
  }
}
