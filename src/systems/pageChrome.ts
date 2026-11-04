import { ROTATE_PROMPT_QUERY, STRINGS } from '../config/strings';
import { COLORS } from '../graphics/palette';

/**
 * Exposes palette colours as CSS variables so index.html (page background,
 * rotate prompt) uses the same colours as the game instead of hand-copied hex values.
 */
export function applyThemeColors(doc: Document = document): void {
  const style = doc.documentElement.style;
  style.setProperty('--color-void', COLORS.void);
  style.setProperty('--color-text', COLORS.white);
}

/** Shows the "turn your device" overlay while ROTATE_PROMPT_QUERY matches; GameScene pauses on the same query. */
export function installRotatePrompt(doc: Document = document, win: Window = window): void {
  const element = doc.getElementById('rotate-device');
  if (!element) return;
  element.textContent = STRINGS.rotateDevice;
  const query = win.matchMedia(ROTATE_PROMPT_QUERY);
  const update = (): void => {
    element.hidden = !query.matches;
  };
  update();
  query.addEventListener('change', update);
}
