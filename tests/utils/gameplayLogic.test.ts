import { describe, expect, it } from 'vitest';
import { Health } from '../../src/components/Health';
import { isStomp, knockbackDirection } from '../../src/utils/combat';
import { JumpController } from '../../src/utils/jumpController';
import { createRng, generateStars } from '../../src/utils/random';
import { comboMultiplier, isNewHighscore, stompPoints } from '../../src/utils/score';

const FRAME = 16;

describe('JumpController', () => {
  const create = () => new JumpController({ coyoteMs: 100, jumpBufferMs: 120 });

  it('jumps when pressed on the ground', () => {
    expect(create().update(FRAME, true, true, true)).toBe('jump');
  });

  it('allows a jump shortly after leaving a ledge (coyote time)', () => {
    const jump = create();
    jump.update(FRAME, true, false, false);
    jump.update(80, false, false, false);
    expect(jump.update(FRAME, false, true, true)).toBe('jump');
  });

  it('refuses a jump long after leaving a ledge', () => {
    const jump = create();
    jump.update(FRAME, true, false, false);
    jump.update(200, false, false, false);
    expect(jump.update(FRAME, false, true, true)).toBe('none');
  });

  it('buffers a press made just before landing', () => {
    const jump = create();
    jump.update(FRAME, false, true, true);
    expect(jump.update(60, true, false, true)).toBe('jump');
  });

  it('cuts the jump when the button is released while rising, and only jumps once per press', () => {
    const jump = create();
    expect(jump.update(FRAME, true, true, true)).toBe('jump');
    expect(jump.update(FRAME, false, false, true)).toBe('none');
    expect(jump.update(FRAME, false, false, false)).toBe('shortenJump');
    expect(jump.update(FRAME, false, false, false)).toBe('none');
  });
});

describe('Health', () => {
  it('takes damage and becomes invulnerable for a while', () => {
    const health = new Health(3, 1000);
    expect(health.damage(1, 0)).toBe(true);
    expect(health.damage(1, 500)).toBe(false);
    expect(health.value).toBe(2);
    expect(health.damage(1, 1000)).toBe(true);
    expect(health.value).toBe(1);
  });

  it('dies at zero and never goes negative', () => {
    const health = new Health(1, 0);
    health.damage(5, 0);
    expect(health.value).toBe(0);
    expect(health.isDead).toBe(true);
    expect(health.damage(1, 10)).toBe(false);
  });
});

describe('combat', () => {
  it('detects stomps only while falling onto the top', () => {
    const base = { playerBottom: 100, enemyTop: 97, tolerance: 6 };
    expect(isStomp({ ...base, playerVelocityY: 200 })).toBe(true);
    expect(isStomp({ ...base, playerVelocityY: -50 })).toBe(false);
    expect(isStomp({ ...base, playerVelocityY: 200, enemyTop: 80 })).toBe(false);
  });

  it('pushes the player away from the source', () => {
    expect(knockbackDirection(10, 20)).toBe(-1);
    expect(knockbackDirection(30, 20)).toBe(1);
  });
});

describe('score', () => {
  it('multiplies chained stomps up to a cap', () => {
    expect(comboMultiplier(0, 8)).toBe(1);
    expect(comboMultiplier(3, 8)).toBe(3);
    expect(comboMultiplier(20, 8)).toBe(8);
    expect(stompPoints(100, 2, 8)).toBe(200);
  });

  it('compares highscores strictly', () => {
    expect(isNewHighscore(10, 5)).toBe(true);
    expect(isNewHighscore(5, 5)).toBe(false);
  });
});

describe('random', () => {
  it('is deterministic per seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('generates stars inside the area', () => {
    const stars = generateStars(200, 64, 32, createRng(1));
    expect(stars).toHaveLength(200);
    expect(stars.every((s) => s.x >= 0 && s.x < 64 && s.y >= 0 && s.y < 32)).toBe(true);
  });
});
