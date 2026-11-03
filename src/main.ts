import Phaser from 'phaser';
import { TOUCH_CONTROLS } from './config/constants';
import { BACKGROUND_COLOR, GAME_HEIGHT, GAME_WIDTH, PHYSICS_FPS } from './config/game';
import { BootScene } from './scenes/BootScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { MenuScene } from './scenes/MenuScene';
import { PauseScene } from './scenes/PauseScene';
import { installErrorOverlay } from './systems/errorOverlay';
import { applyThemeColors, installRotatePrompt } from './systems/pageChrome';

applyThemeColors();
installRotatePrompt();

const game = new Phaser.Game({
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
  input: { gamepad: true, activePointers: TOUCH_CONTROLS.simultaneousTouches },
  physics: {
    default: 'arcade',
    arcade: { fixedStep: true, fps: PHYSICS_FPS, debug: false },
  },
  scene: [
    BootScene,
    MenuScene,
    CharacterSelectScene,
    GameScene,
    HudScene,
    PauseScene,
    GameOverScene,
  ],
});

// The game boots on the next frame, so boot errors are still caught. Stopping the
// loop keeps a crashed game from running on (and later playing sound) behind the overlay.
installErrorOverlay(() => game.loop.sleep());
