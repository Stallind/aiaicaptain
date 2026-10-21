export const SCENE_KEYS = {
  boot: 'BootScene',
  menu: 'MenuScene',
  game: 'GameScene',
  hud: 'HudScene',
  pause: 'PauseScene',
  gameOver: 'GameOverScene',
} as const;

export const TEXTURE_KEYS = {
  tiles: 'tiles',
  starsFar: 'stars-far',
  starsNear: 'stars-near',
  heart: 'ui-heart',
  heartEmpty: 'ui-heart-empty',
} as const;

/** Tileset name shared by the generated Tiled JSON and the generated texture. */
export const TILESET_NAME = 'space-tiles';
export const GROUND_LAYER = 'ground';
export const ENTITY_LAYER = 'entities';
