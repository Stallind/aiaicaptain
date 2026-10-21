import { COLORS } from '../graphics/palette';
import { FONT_FAMILY } from '../config/ui';

const OVERLAY_ID = 'fatal-error';

/**
 * Any uncaught error inside Phaser's game loop stops rendering and leaves a
 * frozen canvas. Catch those at the window level and tell the player instead.
 * Details go to the console only; nothing is shown that could leak internals.
 */
export function installErrorOverlay(target: Window = window): void {
  target.addEventListener('error', (event) => showFatalError(target.document, event.error));
  target.addEventListener('unhandledrejection', (event) =>
    showFatalError(target.document, event.reason),
  );
}

function showFatalError(doc: Document, error: unknown): void {
  console.error('AI AI Captain stopped because of an error:', error);
  if (doc.getElementById(OVERLAY_ID)) return;
  const overlay = doc.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.setAttribute('role', 'alert');
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1em',
    background: COLORS.void,
    color: COLORS.white,
    fontFamily: FONT_FAMILY,
    textAlign: 'center',
    padding: '1em',
  });
  const message = doc.createElement('p');
  message.textContent = 'Something went wrong and the game had to stop.';
  const button = doc.createElement('button');
  button.textContent = 'Reload';
  button.addEventListener('click', () => doc.location.reload());
  overlay.append(message, button);
  doc.body.append(overlay);
}
