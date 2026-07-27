export function isWithinRadius(pointA, pointB, radius) {
  const dx = pointA.x - pointB.x;
  const dz = pointA.z - pointB.z;
  return Math.sqrt(dx * dx + dz * dz) <= radius;
}

export const RAIN_DURATION_SECONDS = 8;
export const RAIN_RADIUS = 10;
export const RAIN_FAITH_MULTIPLIER = 2;
