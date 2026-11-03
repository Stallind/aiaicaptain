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

export const CHARACTER_SELECT_LAYOUT = {
  titleY: 36,
  cardTop: 64,
  /** Cards shrink below this when several share a row. */
  cardWidth: 200,
  /** Cards never extend below this, so they stay clear of the touch buttons and the prompt. */
  cardBottom: 270,
  cardGap: 24,
  sideMargin: 16,
  /** More characters than this are split across pages (◀ ▶ moves between them). */
  cardsPerPage: 3,
  pageIndicatorY: 284,
  /** Portraits are scaled by a whole number to fit this square, so pixels stay even. */
  portraitBox: 108,
  padding: 10,
  nameGap: 10,
  taglineGap: 16,
  /** Height of one wrapped tagline line; extra lines shrink the portrait to keep the card's height. */
  taglineLineHeight: 12,
  /** Longest tagline accepted (validated at boot); about two lines on the narrowest card. */
  maxTaglineChars: 60,
  statsGap: 18,
  /** Space under the last stat row. */
  statsBottomPad: 16,
  statRowHeight: 14,
  statLabelWidth: 56,
  /** Number of pips in the speed and jump bars. */
  statPips: 5,
  pipWidth: 10,
  pipHeight: 6,
  pipGap: 3,
  heartGap: 11,
  /** Beyond this many hearts the card shows "×N" instead, so the row fits. */
  maxHeartsShown: 6,
  borderWidth: 2,
  dimmedAlpha: 0.55,
  promptY: 0.88,
} as const;
