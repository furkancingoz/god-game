import { describe, it, expect } from 'vitest';
import { generateHeightmap } from './noise.js';

describe('generateHeightmap', () => {
  it('returns a Float32Array of length width * height', () => {
    const map = generateHeightmap({ width: 16, height: 16, seed: 42 });
    expect(map).toBeInstanceOf(Float32Array);
    expect(map.length).toBe(256);
  });

  it('produces deterministic output for the same seed', () => {
    const a = generateHeightmap({ width: 16, height: 16, seed: 7 });
    const b = generateHeightmap({ width: 16, height: 16, seed: 7 });
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  it('produces different output for different seeds', () => {
    const a = generateHeightmap({ width: 16, height: 16, seed: 7 });
    const b = generateHeightmap({ width: 16, height: 16, seed: 8 });
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });

  it('keeps all values within the 0..1 range', () => {
    const map = generateHeightmap({ width: 32, height: 32, seed: 3 });
    for (const value of map) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('is higher near the center than at the edges (island falloff)', () => {
    const width = 32;
    const height = 32;
    const map = generateHeightmap({ width, height, seed: 3 });
    const centerValue = map[Math.floor(height / 2) * width + Math.floor(width / 2)];
    const edgeValue = map[0];
    expect(centerValue).toBeGreaterThan(edgeValue);
  });

  it('throws for widths or heights smaller than 2', () => {
    expect(() => generateHeightmap({ width: 1, height: 16 })).toThrow();
    expect(() => generateHeightmap({ width: 16, height: 1 })).toThrow();
  });
});
