import * as THREE from 'three';
import { isWithinRadius, RAIN_DURATION_SECONDS, RAIN_RADIUS, RAIN_FAITH_MULTIPLIER } from './miracleLogic.js';
import { soundEngine } from '../audio/SoundEngine.js';

export class MiracleSystem {
  constructor({ scene, terrain, buildingSystem, farmSystem }) {
    this.scene = scene;
    this.terrain = terrain;
    this.buildingSystem = buildingSystem;
    this.farmSystem = farmSystem;
    this.activeRain = null;
    this.screenShakeIntensity = 0;

    // Rain particles
    this.particleCount = 400;
    const positions = new Float32Array(this.particleCount * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0x80d4ff, size: 0.2, transparent: true, opacity: 0.85 });
    this.rainParticles = new THREE.Points(geometry, material);
    this.rainParticles.visible = false;
    scene.add(this.rainParticles);

    // Sunbeam visual
    const sunBeamGeo = new THREE.CylinderGeometry(3.5, 4.5, 30, 16, 1, true);
    const sunBeamMat = new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0, side: THREE.DoubleSide });
    this.sunBeamMesh = new THREE.Mesh(sunBeamGeo, sunBeamMat);
    this.sunBeamMesh.visible = false;
    scene.add(this.sunBeamMesh);
    this.sunBeamTimer = 0;

    // Fire particles
    const firePositions = new Float32Array(200 * 3);
    const fireGeo = new THREE.BufferGeometry();
    fireGeo.setAttribute('position', new THREE.BufferAttribute(firePositions, 3));
    const fireMat = new THREE.PointsMaterial({ color: 0xff4500, size: 0.35, transparent: true, opacity: 0.9 });
    this.fireParticles = new THREE.Points(fireGeo, fireMat);
    this.fireParticles.visible = false;
    scene.add(this.fireParticles);
    this.fireTimer = 0;

    // Meteor Falling Rock
    const meteorGeo = new THREE.DodecahedronGeometry(1.4, 1);
    const meteorMat = new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0xcc1100, roughness: 0.4 });
    this.meteorMesh = new THREE.Mesh(meteorGeo, meteorMat);
    this.meteorMesh.visible = false;
    scene.add(this.meteorMesh);
    this.meteorTarget = null;
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

    if (this.farmSystem) {
      this.farmSystem.boostGrowthNear(point, RAIN_RADIUS);
    }
    soundEngine.playMiracleChime();
  }

  castSunbeamAt(point) {
    const y = this.terrain.getHeightAt(point.x, point.z);
    this.sunBeamMesh.position.set(point.x, y + 15, point.z);
    this.sunBeamMesh.visible = true;
    this.sunBeamTimer = 4.0;
    soundEngine.playMiracleChime();
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
    soundEngine.playThunder();
  }

  castMeteorAt(point) {
    const startY = 40;
    this.meteorMesh.position.set(point.x + 10, startY, point.z + 10);
    this.meteorMesh.visible = true;
    const groundY = this.terrain.getHeightAt(point.x, point.z);
    this.meteorTarget = { x: point.x, y: groundY, z: point.z, progress: 0 };
    soundEngine.playThunder();
  }

  castBlessingAt(point) {
    if (this.buildingSystem) {
      const hut = this.buildingSystem.buildHutAt(point.x, point.z);
      if (hut) {
        if (this.farmSystem) this.farmSystem.createFarmPlot(point.x + 2, point.z + 2);
        soundEngine.playBuildingConstruct();
      }
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

    // Update Meteor Fall
    if (this.meteorTarget) {
      this.meteorTarget.progress += dt * 1.5;
      const t = this.meteorTarget.progress;

      const currentX = THREE.MathUtils.lerp(this.meteorMesh.position.x, this.meteorTarget.x, dt * 6);
      const currentY = THREE.MathUtils.lerp(this.meteorMesh.position.y, this.meteorTarget.y, dt * 6);
      const currentZ = THREE.MathUtils.lerp(this.meteorMesh.position.z, this.meteorTarget.z, dt * 6);

      this.meteorMesh.position.set(currentX, currentY, currentZ);
      this.meteorMesh.rotation.x += dt * 5;

      if (currentY <= this.meteorTarget.y + 0.5 || t >= 1.0) {
        // Impact!
        this.terrain.lower(this.meteorTarget.x, this.meteorTarget.z, 5, 0.4);
        this.meteorMesh.visible = false;
        this.screenShakeIntensity = 0.6;
        soundEngine.playThunder();
        this.meteorTarget = null;
      }
    }

    // Screen Shake Decay
    if (this.screenShakeIntensity > 0) {
      this.screenShakeIntensity = Math.max(0, this.screenShakeIntensity - dt * 2.0);
    }
  }

  getFaithMultiplierAt(point) {
    if (!this.activeRain) return 1;
    return isWithinRadius(point, this.activeRain.center, RAIN_RADIUS) ? RAIN_FAITH_MULTIPLIER : 1;
  }
}
