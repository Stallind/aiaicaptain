/** Player-facing texts that aren't tied to one scene; collected here so they're easy to reword or translate. */
export const STRINGS = {
  fatalErrorTitle: 'The game crashed.',
  fatalErrorHelp: 'Your highscore is saved. Press Reload to try again.',
  fatalErrorDetails: 'Details (include these if you report the problem)',
  reload: 'Reload',
  rotateDevice: 'Turn your device sideways to play',
  highscoreNotSaved: 'NEW HIGHSCORE! (could not be saved on this device)',
} as const;

/**
 * When the "turn your device" prompt shows and the game pauses itself. A coarse
 * (touch) primary pointer excludes touch-screen laptops held in a tall window.
 * Used by both the HTML overlay and GameScene so they always agree.
 */
export const ROTATE_PROMPT_QUERY = '(orientation: portrait) and (pointer: coarse)';
