import { describe, it, expect } from 'vitest';
import { determineSculptMode } from './sculptInput.js';

describe('determineSculptMode', () => {
  it('returns raise for a plain left click', () => {
    expect(determineSculptMode({ button: 0, shiftKey: false })).toBe('raise');
  });
  it('returns lower for shift + left click', () => {
    expect(determineSculptMode({ button: 0, shiftKey: true })).toBe('lower');
  });
  it('returns lower for a right click', () => {
    expect(determineSculptMode({ button: 2, shiftKey: false })).toBe('lower');
  });
  it('returns null for other buttons', () => {
    expect(determineSculptMode({ button: 1, shiftKey: false })).toBe(null);
  });
});
