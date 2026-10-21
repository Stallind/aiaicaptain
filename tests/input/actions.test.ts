import { describe, expect, it } from 'vitest';
import { ActionState } from '../../src/input/actions';
import type { Action } from '../../src/input/actions';

describe('ActionState', () => {
  it('reports justPressed only on the first frame an action is held', () => {
    const state = new ActionState();
    const held = new Set<Action>();
    const sample = (a: Action) => held.has(a);

    held.add('jump');
    state.update(sample);
    expect(state.isDown('jump')).toBe(true);
    expect(state.justPressed('jump')).toBe(true);

    state.update(sample);
    expect(state.isDown('jump')).toBe(true);
    expect(state.justPressed('jump')).toBe(false);

    held.clear();
    state.update(sample);
    expect(state.isDown('jump')).toBe(false);
    expect(state.justPressed('left')).toBe(false);
  });
});
