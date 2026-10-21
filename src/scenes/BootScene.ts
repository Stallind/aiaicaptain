import Phaser from 'phaser';
import { SCENE_KEYS, TEXTURE_KEYS } from '../config/scenes';
import { CHARACTERS } from '../content/registry';
import { TILES, TILE_PALETTE } from '../content/tiles';
import { HEART_EMPTY_FRAME, HEART_FRAME, UI_PALETTE } from '../content/hudIcons';
import { createSpriteTexture, createStripTexture } from '../graphics/textureFactory';

/** Turns all pixel data into textures once, then hands over to the menu. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.boot);
  }

  create(): void {
    for (const character of CHARACTERS) {
      createSpriteTexture(this, character.id, character.sprite);
    }
    createStripTexture(
      this,
      TEXTURE_KEYS.tiles,
      TILES.map((tile) => tile.frame),
      TILE_PALETTE,
    );
    createStripTexture(this, TEXTURE_KEYS.heart, [HEART_FRAME], UI_PALETTE);
    createStripTexture(this, TEXTURE_KEYS.heartEmpty, [HEART_EMPTY_FRAME], UI_PALETTE);
    this.scene.start(SCENE_KEYS.menu);
  }
}
