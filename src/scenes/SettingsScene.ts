import Phaser from 'phaser';
import { SOUND_IDS } from '../config/audio';
import { TIMING } from '../config/constants';
import { SCENE_KEYS } from '../config/scenes';
import { FONT_FAMILY, FONT_SIZE, SETTINGS_LAYOUT as L } from '../config/ui';
import { MENU_BACKGROUND } from '../content/menu';
import { COLORS } from '../graphics/palette';
import { createInput } from '../input/InputController';
import type { InputController } from '../input/InputController';
import { keysFor } from '../input/keyNames';
import { ParallaxBackground } from '../systems/ParallaxBackground';
import { applyAudioSettings, playEffect } from '../systems/audio';
import { storageOf } from '../systems/sharedStorage';
import { stepVolume, volumePercent } from '../utils/audioSettings';
import type { AudioSettings } from '../utils/audioSettings';
import { cycleIndex } from '../utils/stats';
import { VolumeSlider } from './VolumeSlider';
import { addCenteredText, addPrompt } from './textHelpers';

type VolumeKey = 'music' | 'effects';
type Row = 'music' | 'effects' | 'sound' | 'back';
const ROWS: readonly Row[] = ['music', 'effects', 'sound', 'back'];
const LABELS: Readonly<Record<Row, string>> = {
  music: 'Music',
  effects: 'Effects',
  sound: 'Sound',
  back: 'Back',
};

/** Music and effects volume, and "no sound". Every change is saved at once. */
export class SettingsScene extends Phaser.Scene {
  private controls!: InputController;
  private settings!: AudioSettings;
  private selected = 0;
  private readyAt = 0;
  private leaving = false;
  private readonly labels = new Map<Row, Phaser.GameObjects.Text>();
  private readonly values = new Map<Row, Phaser.GameObjects.Text>();
  private readonly sliders = new Map<VolumeKey, VolumeSlider>();

  constructor() {
    super(SCENE_KEYS.settings);
  }

  create(): void {
    this.labels.clear();
    this.values.clear();
    this.sliders.clear();
    this.selected = 0;
    this.leaving = false;
    this.settings = storageOf(this).getAudioSettings();
    new ParallaxBackground(this, MENU_BACKGROUND);
    const { height } = this.scale.gameSize;
    addCenteredText(this, height * L.titleY, 'SOUND', FONT_SIZE.heading, COLORS.orange);
    ROWS.forEach((row, index) => this.createRow(row, height * L.firstRowY + index * L.rowGap));
    addPrompt(this, height * L.hintY, this.hint());
    // No on-screen game buttons: on touch screens the sliders and labels are tapped directly.
    this.controls = createInput(this, { touchButtons: false });
    this.readyAt = this.time.now + TIMING.inputGraceMs;
    this.refresh();
  }

  override update(): void {
    this.controls.update();
    if (this.leaving) {
      this.scene.start(SCENE_KEYS.menu);
      return;
    }
    if (this.time.now < this.readyAt) return;
    // `up` before anything else: the up key also counts as jump.
    if (this.controls.justPressed('up')) this.select(cycleIndex(this.selected, -1, ROWS.length));
    else if (this.controls.justPressed('down'))
      this.select(cycleIndex(this.selected, 1, ROWS.length));
    else if (this.controls.justPressed('left')) this.adjust(-1);
    else if (this.controls.justPressed('right')) this.adjust(1);
    else if (this.controls.justPressed('jump') || this.controls.justPressed('action'))
      this.confirm();
    else if (this.controls.justPressed('pause') || this.controls.justPressed('settings')) {
      this.leaving = true;
    }
  }

  private createRow(row: Row, y: number): void {
    const centre = this.scale.gameSize.width / 2;
    const style = { fontFamily: FONT_FAMILY, fontSize: `${FONT_SIZE.body}px`, color: COLORS.white };
    const label = this.add
      .text(centre + L.labelX, y, LABELS[row], style)
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.onRowTapped(row));
    this.labels.set(row, label);
    if (row === 'back') return;
    const valueX = row === 'sound' ? centre + L.trackX : centre + L.valueX;
    const value = this.add
      .text(valueX, y, '', style)
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.onRowTapped(row));
    this.values.set(row, value);
    if (row === 'music' || row === 'effects') {
      const slider = new VolumeSlider(this, centre + L.trackX, y, (volume, done) => {
        this.select(ROWS.indexOf(row));
        this.setVolume(row, volume, done);
      });
      this.sliders.set(row, slider);
    }
  }

  private onRowTapped(row: Row): void {
    this.select(ROWS.indexOf(row));
    this.confirm();
  }

  private select(index: number): void {
    this.selected = index;
    this.refresh();
  }

  private currentRow(): Row {
    return ROWS[this.selected] ?? 'back';
  }

  private adjust(direction: 1 | -1): void {
    const row = this.currentRow();
    if (row === 'music' || row === 'effects') {
      this.setVolume(row, stepVolume(this.settings[row], direction), true);
    } else if (row === 'sound') {
      this.toggleSound();
    }
  }

  private confirm(): void {
    const row = this.currentRow();
    if (row === 'sound') this.toggleSound();
    else if (row === 'back') this.leaving = true;
  }

  private setVolume(key: VolumeKey, volume: number, done: boolean): void {
    this.save({ ...this.settings, [key]: volume });
    // A sample of the effects at the new volume, once the change is finished.
    if (key === 'effects' && done) playEffect(this, SOUND_IDS.hurt);
  }

  private toggleSound(): void {
    this.save({ ...this.settings, muted: !this.settings.muted });
  }

  private save(settings: AudioSettings): void {
    this.settings = settings;
    storageOf(this).setAudioSettings(settings);
    applyAudioSettings(this, settings);
    this.refresh();
  }

  private refresh(): void {
    const { music, effects, muted } = this.settings;
    const volumeAlpha = muted ? L.dimmedAlpha : 1;
    this.values.get('music')?.setText(volumePercent(music)).setAlpha(volumeAlpha);
    this.values.get('effects')?.setText(volumePercent(effects)).setAlpha(volumeAlpha);
    this.values.get('sound')?.setText(muted ? 'OFF (no sound)' : 'ON');
    this.sliders.get('music')?.setValue(music);
    this.sliders.get('effects')?.setValue(effects);
    for (const slider of this.sliders.values()) slider.setAlpha(volumeAlpha);
    ROWS.forEach((row, index) => {
      const isSelected = index === this.selected;
      this.labels
        .get(row)
        ?.setText(`${isSelected ? '> ' : '  '}${LABELS[row]}`)
        .setColor(isSelected ? COLORS.yellow : COLORS.white);
    });
  }

  private hint(): string {
    if (this.sys.game.device.input.touch) return 'Drag the sliders, tap Sound to turn it on or off';
    return `${keysFor('up', 1)} ${keysFor('down', 1)} choose    ${keysFor('left', 1)} ${keysFor('right', 1)} change    ${keysFor('action', 1)} select    ${keysFor('pause', 1)} back`;
  }
}
