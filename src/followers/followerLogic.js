export const FOLLOWER_STATES = Object.freeze({
  WANDER: 'wander',
  WORSHIP: 'worship',
});

export function nextFollowerState({ currentState, distanceToShrine, worshipRadius }) {
  if (distanceToShrine <= worshipRadius) return FOLLOWER_STATES.WORSHIP;
  return FOLLOWER_STATES.WANDER;
}

export function stepTowards(position, target, speed, dt) {
  const dx = target.x - position.x;
  const dz = target.z - position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist < 1e-4) return { x: position.x, z: position.z };
  const step = Math.min(speed * dt, dist);
  return {
    x: position.x + (dx / dist) * step,
    z: position.z + (dz / dist) * step,
  };
}

export function pickWanderTarget(rng, bounds) {
  return {
    x: (rng() * 2 - 1) * bounds,
    z: (rng() * 2 - 1) * bounds,
  };
}
