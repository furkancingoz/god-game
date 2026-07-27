import * as THREE from 'three';
import { isWithinRadius, RAIN_DURATION_SECONDS, RAIN_RADIUS, RAIN_FAITH_MULTIPLIER } from './miracleLogic.js';

export class MiracleSystem {
  constructor({ scene }) {
    this.activeRain = null; // { center: {x, z}, remaining: number }
    this.particleCount = 300;

    const positions = new Float32Array(this.particleCount * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0x9fd8ff, size: 0.15, transparent: true, opacity: 0.8 });
    this.rainParticles = new THREE.Points(geometry, material);
    this.rainParticles.visible = false;
    scene.add(this.rainParticles);
  }

  castRainAt(point) {
    this.activeRain = { center: { x: point.x, z: point.z }, remaining: RAIN_DURATION_SECONDS };
    this.rainParticles.visible = true;
    this.rainParticles.position.set(point.x, 8, point.z);

    const positions = this.rainParticles.geometry.attributes.position;
    for (let i = 0; i < this.particleCount; i++) {
      positions.setXYZ(
        i,
        (Math.random() * 2 - 1) * RAIN_RADIUS,
        Math.random() * 6,
        (Math.random() * 2 - 1) * RAIN_RADIUS
      );
    }
    positions.needsUpdate = true;
  }

  update(dt) {
    if (!this.activeRain) return;

    this.activeRain.remaining -= dt;
    if (this.activeRain.remaining <= 0) {
      this.activeRain = null;
      this.rainParticles.visible = false;
      return;
    }

    const positions = this.rainParticles.geometry.attributes.position;
    for (let i = 0; i < this.particleCount; i++) {
      let y = positions.getY(i) - dt * 4;
      if (y < 0) y = 6;
      positions.setY(i, y);
    }
    positions.needsUpdate = true;
  }

  getFaithMultiplierAt(point) {
    if (!this.activeRain) return 1;
    return isWithinRadius(point, this.activeRain.center, RAIN_RADIUS) ? RAIN_FAITH_MULTIPLIER : 1;
  }
}
