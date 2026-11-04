import type Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/game';
import { DEPTH, PARALLAX } from '../config/constants';
import { TEXTURE_KEYS } from '../config/scenes';
import type { LevelBackground } from '../content/types';
import { createStarfieldTexture } from '../graphics/starfield';

/** Two star layers that scroll slower than the camera to give depth. */
export class ParallaxBackground {
  private readonly far: Phaser.GameObjects.TileSprite;
  private readonly near: Phaser.GameObjects.TileSprite;

  constructor(scene: Phaser.Scene, background: LevelBackground) {
    scene.cameras.main.setBackgroundColor(background.color);
    createStarfieldTexture(
      scene,
      TEXTURE_KEYS.starsFar,
      GAME_WIDTH,
      GAME_HEIGHT,
      background.starDensity / PARALLAX.farStarDivisor,
      background.starSeed,
    );
    createStarfieldTexture(
      scene,
      TEXTURE_KEYS.starsNear,
      GAME_WIDTH,
      GAME_HEIGHT,
      background.starDensity / PARALLAX.nearStarDivisor,
      background.starSeed + 1,
    );
    this.far = this.createLayer(scene, TEXTURE_KEYS.starsFar);
    this.near = this.createLayer(scene, TEXTURE_KEYS.starsNear);
  }

  update(camera: Phaser.Cameras.Scene2D.Camera): void {
    this.far.tilePositionX = camera.scrollX * PARALLAX.farFactor;
    this.near.tilePositionX = camera.scrollX * PARALLAX.nearFactor;
    this.far.tilePositionY = camera.scrollY * PARALLAX.farFactor;
    this.near.tilePositionY = camera.scrollY * PARALLAX.nearFactor;
  }

  private createLayer(scene: Phaser.Scene, key: string): Phaser.GameObjects.TileSprite {
    return scene.add
      .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, key)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(DEPTH.background);
  }
}
