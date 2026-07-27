import { describe, it, expect } from 'vitest';
import { FaithSystem, formatFaith } from './FaithSystem.js';

describe('FaithSystem', () => {
  it('starts at zero faith', () => {
    expect(new FaithSystem().faith).toBe(0);
  });

  it('adds faith and returns the new total', () => {
    const faith = new FaithSystem();
    expect(faith.addFaith(10)).toBe(10);
    expect(faith.addFaith(5)).toBe(15);
  });

  it('never drops below zero', () => {
    const faith = new FaithSystem();
    faith.addFaith(3);
    faith.addFaith(-100);
    expect(faith.faith).toBe(0);
  });

  it('accrues faith from worshippers over time on tick', () => {
    const faith = new FaithSystem();
    faith.tick(4, 2, 0.5); // 4 worshippers * 2s * 0.5/s = 4
    expect(faith.faith).toBeCloseTo(4);
  });
});

describe('formatFaith', () => {
  it('floors and formats the value', () => {
    expect(formatFaith(1234.9)).toBe('1.234');
  });

  it('formats zero', () => {
    expect(formatFaith(0)).toBe('0');
  });
});
