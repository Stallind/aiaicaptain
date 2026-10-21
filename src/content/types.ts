/** Maps a single character in a sprite frame to a CSS hex colour, or null for transparent. */
export type Palette = Readonly<Record<string, string | null>>;

/** One frame: equally long rows where every character is a palette key. */
export type SpriteFrame = readonly string[];

export interface AnimationSpec {
  /** Indexes into SpriteData.frames. */
  readonly frames: readonly number[];
  readonly frameRate: number;
  /** -1 loops forever. */
  readonly repeat: number;
}

export interface SpriteData {
  readonly palette: Palette;
  readonly frames: readonly SpriteFrame[];
  readonly animations: Readonly<Record<string, AnimationSpec>>;
}

export type CharacterKind = CharacterDefinition['kind'];

export type ComponentSpec =
  | { readonly type: 'patrol'; readonly turnAtLedges: boolean }
  | { readonly type: 'jumper'; readonly intervalMs: number }
  | { readonly type: 'flyer'; readonly amplitude: number; readonly periodMs: number };

export interface BodySpec {
  readonly width: number;
  readonly height: number;
  readonly offsetX: number;
  readonly offsetY: number;
}

export interface CharacterStats {
  /** Horizontal speed in px/s. */
  readonly speed: number;
  /** Initial upward velocity of a jump in px/s. */
  readonly jumpVelocity: number;
  readonly health: number;
}

/** Fields every placeable figure has, whatever its kind. */
export interface BaseCharacterDefinition {
  readonly id: string;
  readonly sprite: SpriteData;
  readonly body: BodySpec;
}

export interface PlayerDefinition extends BaseCharacterDefinition {
  readonly kind: 'player';
  readonly stats: CharacterStats;
}

export interface EnemyDefinition extends BaseCharacterDefinition {
  readonly kind: 'enemy';
  readonly stats: CharacterStats;
  /** Points for defeating it. */
  readonly scoreValue: number;
  /** Whether landing on top defeats it. */
  readonly stompable: boolean;
  readonly components: readonly ComponentSpec[];
}

export interface CollectibleDefinition extends BaseCharacterDefinition {
  readonly kind: 'collectible';
  /** Points for picking it up. */
  readonly scoreValue: number;
}

export interface GoalDefinition extends BaseCharacterDefinition {
  readonly kind: 'goal';
}

/**
 * Everything a level can place. Discriminated by `kind`, so each kind only
 * carries the fields that mean something for it.
 */
export type CharacterDefinition =
  PlayerDefinition | EnemyDefinition | CollectibleDefinition | GoalDefinition;

export interface TileDefinition {
  /** Character used in level layouts. */
  readonly char: string;
  readonly solid: boolean;
  /** Only collides from above, so the player can jump up through it. */
  readonly oneWay: boolean;
  readonly hazard: boolean;
  readonly frame: SpriteFrame;
}

export interface LevelBackground {
  readonly color: string;
  readonly starSeed: number;
  /** Stars per 1000 square pixels. */
  readonly starDensity: number;
}

export interface LevelDefinition {
  readonly id: string;
  readonly name: string;
  /** Downward gravity in px/s². */
  readonly gravity: number;
  readonly background: LevelBackground;
  /**
   * ASCII map, one string per tile row. Tile characters come from the tile
   * legend; entity characters from `entities`; anything else must be '.'.
   */
  readonly layout: readonly string[];
  /** Maps layout characters to character ids from the registry. */
  readonly entities: Readonly<Record<string, string>>;
  readonly nextLevel: string | null;
}
