import type { CharacterDefinition, CharacterStats } from '../content/types';
import { validateFrame, validateSprite } from '../graphics/parseSprite';

export interface CharacterLimits {
  /** Widest texture the game may create; a sprite strip is frame width × frame count. */
  readonly maxTextureSize: number;
  /** Longest tagline the select screen can lay out. */
  readonly maxTaglineChars: number;
}

/** Returns a list of problems; an empty list means the character can be loaded and played. */
export function validateCharacter(c: CharacterDefinition, limits: CharacterLimits): string[] {
  const errors = [...validateSprite(c.sprite), ...validateBody(c), ...validateStrip(c, limits)];
  if (c.kind === 'player') {
    errors.push(...validateStats(c.stats, true));
    if (c.displayName.trim() === '') errors.push('displayName is empty');
    if (c.tagline.trim() === '') errors.push('tagline is empty');
    if (c.tagline.length > limits.maxTaglineChars) {
      errors.push(`tagline is ${c.tagline.length} characters, max is ${limits.maxTaglineChars}`);
    }
    errors.push(
      ...validateFrame(c.portrait.frame, c.portrait.palette).map((e) => `portrait: ${e}`),
    );
  }
  if (c.kind === 'enemy') errors.push(...validateStats(c.stats, false));
  return errors;
}

function validateBody(c: CharacterDefinition): string[] {
  const frame = c.sprite.frames[0] ?? [];
  const width = frame[0]?.length ?? 0;
  const { offsetX, offsetY, width: bodyWidth, height: bodyHeight } = c.body;
  const errors: string[] = [];
  if (!(bodyWidth > 0 && bodyHeight > 0)) errors.push('body width and height must be positive');
  if (offsetX < 0 || offsetY < 0) errors.push('body offsets must not be negative');
  if (offsetX + bodyWidth > width || offsetY + bodyHeight > frame.length) {
    errors.push(
      `body (${bodyWidth}×${bodyHeight} at ${offsetX},${offsetY}) does not fit the ${width}×${frame.length} frame`,
    );
  }
  return errors;
}

function validateStrip(c: CharacterDefinition, limits: CharacterLimits): string[] {
  const frameWidth = c.sprite.frames[0]?.[0]?.length ?? 0;
  const stripWidth = frameWidth * c.sprite.frames.length;
  return stripWidth > limits.maxTextureSize
    ? [
        `sprite strip is ${stripWidth}px wide, max is ${limits.maxTextureSize}px – use fewer or smaller frames`,
      ]
    : [];
}

/** Players must be able to move and jump; enemies may stand still. Health 0 would make anything unkillable. */
function validateStats(stats: CharacterStats, mustMove: boolean): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(stats.health) || stats.health < 1) {
    errors.push(`health must be a whole number of at least 1, got ${stats.health}`);
  }
  for (const [name, value] of [
    ['speed', stats.speed],
    ['jumpVelocity', stats.jumpVelocity],
  ] as const) {
    const valid = Number.isFinite(value) && (mustMove ? value > 0 : value >= 0);
    if (!valid)
      errors.push(`${name} must be ${mustMove ? 'positive' : 'zero or more'}, got ${value}`);
  }
  return errors;
}
