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
  quitY: 0.65,
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

export const SETTINGS_LAYOUT = {
  titleY: 0.16,
  firstRowY: 0.36,
  rowGap: 38,
  /** Horizontal positions relative to the screen centre. */
  labelX: -170,
  trackX: -50,
  trackWidth: 160,
  trackHeight: 4,
  knobWidth: 6,
  knobHeight: 14,
  valueX: 128,
  /** Extra clickable space around a slider track, so it is easy to hit with a thumb. */
  hitPadding: 12,
  /** How faded the volume rows look while sound is off. */
  dimmedAlpha: 0.4,
  hintY: 0.9,
} as const;

/** A small clickable label in a screen corner, such as the menu's SOUND button. */
export const CORNER_BUTTON = {
  margin: 10,
  paddingX: 6,
  paddingY: 4,
} as const;
