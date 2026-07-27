import { describe, it, expect } from 'vitest';
import { FOLLOWER_STATES, nextFollowerState, stepTowards, pickWanderTarget } from './followerLogic.js';

describe('nextFollowerState', () => {
  it('transitions to worship when within the worship radius', () => {
    const state = nextFollowerState({ currentState: FOLLOWER_STATES.WANDER, distanceToShrine: 2, worshipRadius: 5 });
    expect(state).toBe(FOLLOWER_STATES.WORSHIP);
  });

  it('returns to wander when outside the worship radius', () => {
    const state = nextFollowerState({ currentState: FOLLOWER_STATES.WORSHIP, distanceToShrine: 10, worshipRadius: 5 });
    expect(state).toBe(FOLLOWER_STATES.WANDER);
  });
});

describe('stepTowards', () => {
  it('moves position toward the target by speed * dt', () => {
    const result = stepTowards({ x: 0, z: 0 }, { x: 10, z: 0 }, 2, 1);
    expect(result.x).toBeCloseTo(2);
    expect(result.z).toBeCloseTo(0);
  });

  it('does not overshoot the target', () => {
    const result = stepTowards({ x: 0, z: 0 }, { x: 1, z: 0 }, 10, 1);
    expect(result.x).toBeCloseTo(1);
  });

  it('returns the same position when already at the target', () => {
    const result = stepTowards({ x: 5, z: 5 }, { x: 5, z: 5 }, 2, 1);
    expect(result.x).toBeCloseTo(5);
    expect(result.z).toBeCloseTo(5);
  });
});

describe('pickWanderTarget', () => {
  it('returns the positive bound for rng() === 1', () => {
    const rng = () => 1;
    const target = pickWanderTarget(rng, 10);
    expect(target.x).toBeCloseTo(10);
    expect(target.z).toBeCloseTo(10);
  });

  it('returns the negative bound for rng() === 0', () => {
    const rng = () => 0;
    const target = pickWanderTarget(rng, 10);
    expect(target.x).toBeCloseTo(-10);
    expect(target.z).toBeCloseTo(-10);
  });
});
