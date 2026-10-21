export const FONT_FAMILY = 'monospace';

/** Font sizes in game pixels. */
export const FONT_SIZE = {
  title: 40,
  heading: 32,
  banner: 24,
  score: 20,
  body: 12,
  small: 10,
} as const;

export const PROMPT_PULSE = {
  minAlpha: 0.35,
  durationMs: 700,
} as const;

// Vertical positions are fractions of the screen height so layouts survive a resolution change.
export const MENU_LAYOUT = {
  titleY: 0.2,
  subtitleGap: 32,
  heroY: 0.55,
  heroScale: 4,
  promptY: 0.75,
  controlsY: 0.85,
  highscoreY: 0.93,
  /** Background scroll in px per ms of elapsed time. */
  scrollSpeed: 0.02,
} as const;

export const PAUSE_LAYOUT = {
  titleY: 0.4,
  promptY: 0.55,
  overlayAlpha: 0.6,
} as const;

export const GAME_OVER_LAYOUT = {
  titleY: 0.25,
  subtitleGap: 36,
  scoreY: 0.5,
  highscoreGap: 26,
  promptY: 0.75,
} as const;
