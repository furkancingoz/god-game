export const FOLLOWER_STATES = Object.freeze({
  WANDER: 'wander',
  WORSHIP: 'worship',
  WORK: 'work',
  PROPHET_PREACH: 'prophet_preach',
});

export const FOLLOWER_NAMES = [
  'Aron', 'Elia', 'Kael', 'Lyra', 'Tariq', 'Mina', 'Zephyr', 'Orion',
  'Selene', 'Atlas', 'Nova', 'Thorne', 'Iris', 'Cyrus', 'Vera', 'Solon'
];

export function generateFollowerProfile(index) {
  const name = FOLLOWER_NAMES[index % FOLLOWER_NAMES.length] || `Takipçi ${index + 1}`;
  return {
    id: `follower_${index}_${Date.now()}`,
    name,
    isProphet: false,
    hunger: 100, // 100 = full, 0 = starving
    energy: 100,
    devotion: 80,
    role: 'Worshipper',
  };
}

export function nextFollowerState({ currentState, distanceToShrine, worshipRadius, isProphet }) {
  if (isProphet) return FOLLOWER_STATES.PROPHET_PREACH;
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
