import Phaser from 'phaser';
import { SCENE_KEYS, TEXTURE_KEYS, portraitTextureKey } from '../config/scenes';
import { MAX_TEXTURE_SIZE } from '../config/constants';
import { CHARACTER_SELECT_LAYOUT } from '../config/ui';
import { CHARACTERS, PLAYER_CHARACTERS, contentErrors } from '../content/registry';
import { TILES, TILE_PALETTE } from '../content/tiles';
import { HEART_EMPTY_FRAME, HEART_FRAME, UI_PALETTE } from '../content/hudIcons';
import { createSpriteTexture, createStripTexture } from '../graphics/textureFactory';

/** Turns all pixel data into textures once, then hands over to the menu. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.boot);
  }

  create(): void {
    this.assertContentIsValid();
    for (const character of CHARACTERS) {
      createSpriteTexture(this, character.id, character.sprite);
    }
    for (const player of PLAYER_CHARACTERS) {
      const { frame, palette } = player.portrait;
      createStripTexture(this, portraitTextureKey(player.id), [frame], palette);
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

  private assertContentIsValid(): void {
    const errors = contentErrors({
      maxTextureSize: MAX_TEXTURE_SIZE,
      maxTaglineChars: CHARACTER_SELECT_LAYOUT.maxTaglineChars,
    });
    if (errors.length > 0) throw new Error(`Invalid game content:\n${errors.join('\n')}`);
  }
}
