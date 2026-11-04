import Phaser from 'phaser';
import { SETTINGS_LAYOUT as L } from '../config/ui';
import { COLORS } from '../graphics/palette';
import { volumeAtPosition } from '../utils/audioSettings';

function color(hex: string): number {
  return Phaser.Display.Color.HexStringToColor(hex).color;
}

/**
 * A horizontal volume slider. Mouse and touch drag it directly; the keyboard and
 * gamepad change it through the settings scene, which calls setValue().
 */
export class VolumeSlider {
  private readonly track: Phaser.GameObjects.Rectangle;
  private readonly fill: Phaser.GameObjects.Rectangle;
  private readonly knob: Phaser.GameObjects.Rectangle;
  private readonly hitArea: Phaser.GameObjects.Zone;
  private dragging = false;

  constructor(
    scene: Phaser.Scene,
    private readonly left: number,
    y: number,
    /** Called with the new volume while dragging, and with `done` true on release. */
    onDrag: (volume: number, done: boolean) => void,
  ) {
    this.track = scene.add
      .rectangle(left, y, L.trackWidth, L.trackHeight, color(COLORS.slate))
      .setOrigin(0, 0.5);
    this.fill = scene.add
      .rectangle(left, y, 0, L.trackHeight, color(COLORS.cyan))
      .setOrigin(0, 0.5);
    this.knob = scene.add.rectangle(left, y, L.knobWidth, L.knobHeight, color(COLORS.white));
    const hitWidth = L.trackWidth + L.hitPadding * 2;
    const hitHeight = L.knobHeight + L.hitPadding * 2;
    this.hitArea = scene.add
      .zone(left - L.hitPadding, y - hitHeight / 2, hitWidth, hitHeight)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });

    const valueAt = (pointer: Phaser.Input.Pointer): number =>
      volumeAtPosition(pointer.x, this.left, L.trackWidth);
    this.hitArea.on(
      Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN,
      (pointer: Phaser.Input.Pointer) => {
        this.dragging = true;
        onDrag(valueAt(pointer), false);
      },
    );
    // Listen on the whole scene so a drag continues when the finger slides off the track.
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, (pointer: Phaser.Input.Pointer) => {
      if (this.dragging && pointer.isDown) onDrag(valueAt(pointer), false);
    });
    scene.input.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      this.dragging = false;
      onDrag(valueAt(pointer), true);
    });
  }

  setValue(volume: number): void {
    this.fill.width = volume * L.trackWidth;
    this.knob.x = this.left + volume * L.trackWidth;
  }

  setAlpha(alpha: number): void {
    for (const part of [this.track, this.fill, this.knob]) part.setAlpha(alpha);
  }
}
