import { describe, it, expect } from 'vitest';
import { isWithinRadius } from './miracleLogic.js';

describe('isWithinRadius', () => {
  it('returns true when points are exactly at the radius boundary', () => {
    expect(isWithinRadius({ x: 0, z: 0 }, { x: 5, z: 0 }, 5)).toBe(true);
  });

  it('returns true for points inside the radius', () => {
    expect(isWithinRadius({ x: 0, z: 0 }, { x: 1, z: 1 }, 5)).toBe(true);
  });

  it('returns false for points outside the radius', () => {
    expect(isWithinRadius({ x: 0, z: 0 }, { x: 10, z: 0 }, 5)).toBe(false);
  });
});
