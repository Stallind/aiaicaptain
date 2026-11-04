import { STRINGS } from '../config/strings';
import { FONT_FAMILY } from '../config/ui';
import { COLORS } from '../graphics/palette';

const OVERLAY_ID = 'fatal-error';

/**
 * Any uncaught error inside Phaser's game loop leaves a frozen canvas. Catch
 * those at the window level, stop the game (`onFatal`) and tell the player what
 * happened and what to do. The error message is shown collapsed so it can be
 * included in a bug report; a static game has nothing secret to leak.
 */
export function installErrorOverlay(onFatal: () => void, target: Window = window): void {
  const handle = (error: unknown): void => {
    console.error('AI AI Captain stopped because of an error:', error);
    onFatal();
    showFatalError(target.document, error);
  };
  target.addEventListener('error', (event) => handle(event.error ?? event.message));
  target.addEventListener('unhandledrejection', (event) => handle(event.reason));
}

function describe(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return typeof error === 'string' && error !== '' ? error : 'Unknown error';
}

function showFatalError(doc: Document, error: unknown): void {
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

  const title = doc.createElement('h1');
  title.textContent = STRINGS.fatalErrorTitle;
  const help = doc.createElement('p');
  help.textContent = STRINGS.fatalErrorHelp;
  const button = doc.createElement('button');
  button.textContent = STRINGS.reload;
  button.addEventListener('click', () => doc.location.reload());

  const details = doc.createElement('details');
  const summary = doc.createElement('summary');
  summary.textContent = STRINGS.fatalErrorDetails;
  const message = doc.createElement('code');
  message.textContent = describe(error);
  details.append(summary, message);

  overlay.append(title, help, button, details);
  doc.body.append(overlay);
  button.focus();
}
