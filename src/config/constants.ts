import type { Action } from '../input/actions';

export const TILE_SIZE = 16;

export const PLAYER_TUNING = {
  /** Grace period after leaving a ledge where a jump is still allowed. */
  coyoteMs: 100,
  /** A jump pressed this long before landing is still executed. */
  jumpBufferMs: 120,
  /** Upward velocity is multiplied by this when jump is released early. */
  jumpCutFactor: 0.45,
  maxFallSpeed: 520,
  invulnerableMs: 1200,
  /** Fraction of jump velocity used for the bounce after a stomp. */
  stompBounceFactor: 0.75,
  /** How far below the enemy's top the feet may already be at the start of a step and still count as a stomp. */
  stompTolerance: 6,
  knockbackX: 140,
  knockbackY: 200,
  /** Horizontal input is ignored this long after a hit so the knockback is visible. */
  knockbackLockMs: 250,
  /** Fraction of jump velocity for the hop before falling off-screen on death. */
  deathHopFactor: 0.8,
} as const;

export const SCORE = {
  /** Multiplier cap for chained stomps without touching the ground. */
  maxComboMultiplier: 8,
  levelCompleteBonus: 1000,
} as const;

export const TIMING = {
  deathDelayMs: 900,
  levelCompleteDelayMs: 700,
  blinkIntervalMs: 80,
  /** Menus ignore input this long after opening, so a held key from the previous screen doesn't skip them. */
  inputGraceMs: 350,
} as const;

export const CAMERA = {
  /** 0..1, lower is smoother but lags more. */
  lerp: 0.12,
  deadzoneWidth: 48,
  deadzoneHeight: 64,
} as const;

export const WORLD_LIMITS = {
  /** How far below the map the player may fall before counting as lost. */
  playerFallMargin: 32,
  /** Enemies this far below the map are removed. */
  enemyCleanupMargin: 64,
  /** Hazard probes sit this many pixels inside the hitbox, so a diagonal touch doesn't count. */
  hazardProbeInset: 1,
} as const;

export const HUD = {
  margin: 8,
  heartSpacing: 12,
  heartScale: 1,
  levelBannerMs: 2200,
  levelBannerFadeMs: 500,
  /** Fraction of screen height. */
  levelBannerY: 0.3,
} as const;

export const DEPTH = {
  background: -10,
  tiles: 0,
  pickups: 5,
  enemies: 10,
  player: 20,
  popups: 30,
  touchControls: 100,
} as const;

export type TouchAnchor = 'bottom-left' | 'bottom-right' | 'top-right';

export interface TouchButtonSpec {
  readonly action: Action;
  readonly label: string;
  readonly anchor: TouchAnchor;
  /** Position counted inwards from the anchored corner: 0 is closest to it. */
  readonly slot: number;
  /** Radius as a fraction of `buttonRadius`. */
  readonly size: number;
}

export const TOUCH_CONTROLS = {
  buttonRadius: 34,
  margin: 18,
  alpha: 0.35,
  activeAlpha: 0.6,
  /** Label font size relative to the button radius. */
  labelScale: 0.8,
  /** Fingers tracked at once: move + jump + one spare for sliding between buttons. */
  simultaneousTouches: 3,
  buttons: [
    { action: 'left', label: '<', anchor: 'bottom-left', slot: 0, size: 1 },
    { action: 'right', label: '>', anchor: 'bottom-left', slot: 1, size: 1 },
    { action: 'jump', label: 'A', anchor: 'bottom-right', slot: 0, size: 1 },
    { action: 'pause', label: 'II', anchor: 'top-right', slot: 0, size: 0.5 },
  ],
} as const satisfies {
  readonly buttons: readonly TouchButtonSpec[];
  readonly [key: string]: unknown;
};

/**
 * Widest canvas texture created at boot. Many phones refuse canvases wider than
 * 4096 px, and a sprite strip is one frame wide per animation frame.
 */
export const MAX_TEXTURE_SIZE = 4096;

export const PARALLAX = {
  farFactor: 0.1,
  nearFactor: 0.3,
  farStarDivisor: 1,
  nearStarDivisor: 4,
} as const;

export const COLLECTIBLE_BOB = {
  amplitude: 2,
  durationMs: 600,
} as const;

/** Short animations played when entities are removed. */
export const ENTITY_FX = {
  enemyDefeatMs: 250,
  enemyDefeatScaleY: 0.2,
  pickupMs: 200,
  pickupRise: 12,
} as const;

export const SCORE_POPUP = {
  rise: 16,
  durationMs: 600,
  /** Max popups on screen at once; extra awards simply show no popup. */
  poolSize: 12,
} as const;
