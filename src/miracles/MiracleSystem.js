import * as THREE from 'three';
import { isWithinRadius, RAIN_DURATION_SECONDS, RAIN_RADIUS, RAIN_FAITH_MULTIPLIER } from './miracleLogic.js';

export class MiracleSystem {
  constructor({ scene, terrain, buildingSystem }) {
    this.scene = scene;
    this.terrain = terrain;
    this.buildingSystem = buildingSystem;
    this.activeRain = null; // { center: {x, z}, remaining: number }

    // Rain particles
    this.particleCount = 400;
    const positions = new Float32Array(this.particleCount * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0x80d4ff, size: 0.2, transparent: true, opacity: 0.85 });
    this.rainParticles = new THREE.Points(geometry, material);
    this.rainParticles.visible = false;
    scene.add(this.rainParticles);

    // Sunbeam visual (Cylinder light beam)
    const sunBeamGeo = new THREE.CylinderGeometry(3.5, 4.5, 30, 16, 1, true);
    const sunBeamMat = new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0, side: THREE.DoubleSide });
    this.sunBeamMesh = new THREE.Mesh(sunBeamGeo, sunBeamMat);
    this.sunBeamMesh.visible = false;
    scene.add(this.sunBeamMesh);
    this.sunBeamTimer = 0;

    // Divine Fire / Smite particles
    const firePositions = new Float32Array(200 * 3);
    const fireGeo = new THREE.BufferGeometry();
    fireGeo.setAttribute('position', new THREE.BufferAttribute(firePositions, 3));
    const fireMat = new THREE.PointsMaterial({ color: 0xff4500, size: 0.35, transparent: true, opacity: 0.9 });
    this.fireParticles = new THREE.Points(fireGeo, fireMat);
    this.fireParticles.visible = false;
    scene.add(this.fireParticles);
    this.fireTimer = 0;
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

  castSunbeamAt(point) {
    const y = this.terrain.getHeightAt(point.x, point.z);
    this.sunBeamMesh.position.set(point.x, y + 15, point.z);
    this.sunBeamMesh.visible = true;
    this.sunBeamTimer = 4.0; // 4 seconds
  }

  castFireAt(point) {
    const y = this.terrain.getHeightAt(point.x, point.z);
    this.fireParticles.position.set(point.x, y + 0.5, point.z);
    this.fireParticles.visible = true;
    this.fireTimer = 3.5;

    const positions = this.fireParticles.geometry.attributes.position;
    for (let i = 0; i < 200; i++) {
      positions.setXYZ(
        i,
        (Math.random() * 2 - 1) * 3,
        Math.random() * 2,
        (Math.random() * 2 - 1) * 3
      );
    }
    positions.needsUpdate = true;
  }

  castBlessingAt(point) {
    if (this.buildingSystem) {
      this.buildingSystem.buildHutAt(point.x, point.z);
    }
  }

  update(dt) {
    // Update Rain
    if (this.activeRain) {
      this.activeRain.remaining -= dt;
      if (this.activeRain.remaining <= 0) {
        this.activeRain = null;
        this.rainParticles.visible = false;
      } else {
        const positions = this.rainParticles.geometry.attributes.position;
        for (let i = 0; i < this.particleCount; i++) {
          let y = positions.getY(i) - dt * 6;
          if (y < 0) y = 6;
          positions.setY(i, y);
        }
        positions.needsUpdate = true;
      }
    }

    // Update Sunbeam
    if (this.sunBeamTimer > 0) {
      this.sunBeamTimer -= dt;
      const opacity = Math.sin((this.sunBeamTimer / 4.0) * Math.PI) * 0.45;
      this.sunBeamMesh.material.opacity = Math.max(0, opacity);
      this.sunBeamMesh.rotation.y += dt * 0.5;
      if (this.sunBeamTimer <= 0) {
        this.sunBeamMesh.visible = false;
      }
    }

    // Update Fire
    if (this.fireTimer > 0) {
      this.fireTimer -= dt;
      const positions = this.fireParticles.geometry.attributes.position;
      for (let i = 0; i < 200; i++) {
        let y = positions.getY(i) + dt * 2.5;
        if (y > 3) y = 0;
        positions.setY(i, y);
      }
      this.fireParticles.geometry.attributes.position.needsUpdate = true;
      if (this.fireTimer <= 0) {
        this.fireParticles.visible = false;
      }
    }
  }

  getFaithMultiplierAt(point) {
    if (!this.activeRain) return 1;
    return isWithinRadius(point, this.activeRain.center, RAIN_RADIUS) ? RAIN_FAITH_MULTIPLIER : 1;
  }
}
