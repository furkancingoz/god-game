import { describe, it, expect } from 'vitest';
import { sampleHeight, applySculpt } from './TerrainSystem.js';

describe('sampleHeight', () => {
  it('returns exact grid value at integer coordinates', () => {
    const heightmap = new Float32Array([0, 1, 2, 3]); // 2x2 grid
    expect(sampleHeight(heightmap, 2, 2, 0, 0)).toBe(0);
    expect(sampleHeight(heightmap, 2, 2, 1, 0)).toBe(1);
    expect(sampleHeight(heightmap, 2, 2, 0, 1)).toBe(2);
    expect(sampleHeight(heightmap, 2, 2, 1, 1)).toBe(3);
  });

  it('interpolates between grid points', () => {
    const heightmap = new Float32Array([0, 10]); // 2x1 grid
    expect(sampleHeight(heightmap, 2, 1, 0.5, 0)).toBeCloseTo(5);
  });

  it('clamps out-of-range coordinates to the grid edge', () => {
    const heightmap = new Float32Array([0, 10]);
    expect(sampleHeight(heightmap, 2, 1, -5, 0)).toBe(0);
    expect(sampleHeight(heightmap, 2, 1, 5, 0)).toBe(10);
  });
});

describe('applySculpt', () => {
  it('raises the height at the center point by the full strength', () => {
    const heightmap = new Float32Array(9); // 3x3, all zeros
    applySculpt(heightmap, 3, 3, 1, 1, 1, 0.5);
    expect(heightmap[1 * 3 + 1]).toBeCloseTo(0.5);
  });

  it('leaves points outside the radius untouched', () => {
    const heightmap = new Float32Array(9);
    applySculpt(heightmap, 3, 3, 1, 1, 0.5, 0.5);
    expect(heightmap[0]).toBe(0);
  });

  it('applies a falloff so edge-of-radius points change less than the center', () => {
    const heightmap = new Float32Array(25); // 5x5
    applySculpt(heightmap, 5, 5, 2, 2, 2, 1);
    const center = heightmap[2 * 5 + 2];
    const edge = heightmap[2 * 5 + 4];
    expect(center).toBeGreaterThan(edge);
  });

  it('clamps values to the 0..2 range', () => {
    const heightmap = new Float32Array([1.9]);
    applySculpt(heightmap, 1, 1, 0, 0, 1, 1);
    expect(heightmap[0]).toBeLessThanOrEqual(2);

    const negHeightmap = new Float32Array([0.05]);
    applySculpt(negHeightmap, 1, 1, 0, 0, 1, -1);
    expect(negHeightmap[0]).toBeGreaterThanOrEqual(0);
  });
});
