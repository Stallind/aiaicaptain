import Phaser from 'phaser';
import { BACKGROUND_COLOR, GAME_HEIGHT, GAME_WIDTH, PHYSICS_FPS } from './config/game';
import { BootScene } from './scenes/BootScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { MenuScene } from './scenes/MenuScene';
import { PauseScene } from './scenes/PauseScene';
import { installErrorOverlay } from './systems/errorOverlay';

installErrorOverlay();

new Phaser.Game({
  type: Phaser.AUTO,
  banner: false,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: BACKGROUND_COLOR,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: { gamepad: true },
  physics: {
    default: 'arcade',
    arcade: { fixedStep: true, fps: PHYSICS_FPS, debug: false },
  },
  scene: [BootScene, MenuScene, GameScene, HudScene, PauseScene, GameOverScene],
});
