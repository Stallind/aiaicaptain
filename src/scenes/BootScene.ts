import Phaser from 'phaser';
import { SCENE_KEYS, TEXTURE_KEYS, portraitTextureKey } from '../config/scenes';
import { MAX_TEXTURE_SIZE } from '../config/constants';
import { CHARACTER_SELECT_LAYOUT } from '../config/ui';
import { AUDIO } from '../config/audio';
import { CHARACTERS, PLAYER_CHARACTERS, contentErrors, soundErrors } from '../content/registry';
import { TILES, TILE_PALETTE } from '../content/tiles';
import { HEART_EMPTY_FRAME, HEART_FRAME, UI_PALETTE } from '../content/hudIcons';
import { createSpriteTexture, createStripTexture } from '../graphics/textureFactory';
import { registerSounds } from '../systems/audio';

/** Turns all pixel data into textures and all note data into sounds once, then hands over to the menu. */
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
    registerSounds(this);
    this.scene.start(SCENE_KEYS.menu);
  }

  private assertContentIsValid(): void {
    const errors = contentErrors({
      maxTextureSize: MAX_TEXTURE_SIZE,
      maxTaglineChars: CHARACTER_SELECT_LAYOUT.maxTaglineChars,
    }).concat(soundErrors(AUDIO.sampleRate));
    if (errors.length > 0) throw new Error(`Invalid game content:\n${errors.join('\n')}`);
  }
}
