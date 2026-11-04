/**
 * Abstract actions. `up`/`down` move through menu rows, `quit` leaves the paused
 * level for character select, `settings` opens the sound settings from the menu.
 */
export const ACTIONS = [
  'left',
  'right',
  'jump',
  'action',
  'pause',
  'up',
  'down',
  'quit',
  'settings',
] as const;
export type Action = (typeof ACTIONS)[number];

export interface InputSource {
  isDown(action: Action): boolean;
  /** Called once per frame before sampling, for sources that poll. */
  update?(): void;
  destroy?(): void;
}

function emptyRecord(): Record<Action, boolean> {
  return {
    left: false,
    right: false,
    jump: false,
    action: false,
    pause: false,
    up: false,
    down: false,
    quit: false,
    settings: false,
  };
}

/** Tracks held and just-pressed state per action. Free of Phaser so it can be unit-tested. */
export class ActionState {
  private readonly current = emptyRecord();
  private readonly previous = emptyRecord();

  update(sample: (action: Action) => boolean): void {
    for (const action of ACTIONS) {
      this.previous[action] = this.current[action];
      this.current[action] = sample(action);
    }
  }

  isDown(action: Action): boolean {
    return this.current[action];
  }

  justPressed(action: Action): boolean {
    return this.current[action] && !this.previous[action];
  }
}
