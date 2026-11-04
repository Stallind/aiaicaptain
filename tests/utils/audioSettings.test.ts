import { describe, expect, it } from 'vitest';
import {
  parseAudioSettings,
  stepVolume,
  volumeAtPosition,
  volumePercent,
} from '../../src/utils/audioSettings';

const DEFAULTS = { music: 0.5, effects: 0.8, muted: false };

describe('audio settings', () => {
  it('steps the volume in tenths and stays within 0..1', () => {
    expect(stepVolume(0.5, 1)).toBe(0.6);
    expect(stepVolume(0.1, -1)).toBe(0);
    expect(stepVolume(0, -1)).toBe(0);
    expect(stepVolume(1, 1)).toBe(1);
    // No floating-point dust: 0.2 + 0.1 is stored and shown as 0.3.
    expect(stepVolume(0.2, 1)).toBe(0.3);
  });

  it('turns a click on the slider track into a volume', () => {
    expect(volumeAtPosition(100, 100, 160)).toBe(0);
    expect(volumeAtPosition(180, 100, 160)).toBe(0.5);
    expect(volumeAtPosition(400, 100, 160)).toBe(1);
    expect(volumeAtPosition(50, 100, 160)).toBe(0);
    expect(volumeAtPosition(150, 100, 0)).toBe(0);
  });

  it('shows volumes as whole percentages', () => {
    expect(volumePercent(0.5)).toBe('50%');
    expect(volumePercent(0)).toBe('0%');
  });

  it('reads saved settings and falls back field by field on bad data', () => {
    expect(parseAudioSettings('{"music":0.3,"effects":1,"muted":true}', DEFAULTS)).toEqual({
      music: 0.3,
      effects: 1,
      muted: true,
    });
    expect(parseAudioSettings(null, DEFAULTS)).toEqual(DEFAULTS);
    expect(parseAudioSettings('not json', DEFAULTS)).toEqual(DEFAULTS);
    expect(parseAudioSettings('[1,2]', DEFAULTS)).toEqual(DEFAULTS);
    expect(parseAudioSettings('{"music":"loud","effects":7,"muted":"yes"}', DEFAULTS)).toEqual({
      music: 0.5,
      effects: 1,
      muted: false,
    });
  });
});
