import * as THREE from 'three';
import { FOLLOWER_STATES, nextFollowerState, stepTowards, pickWanderTarget } from './followerLogic.js';

const WANDER_SPEED = 1.5;
const WORSHIP_RADIUS = 6;
const WANDER_BOUNDS = 18;

export class FollowerSystem {
  constructor({ scene, terrain, count = 18, shrinePosition = { x: 0, z: 0 } }) {
    this.terrain = terrain;
    this.shrinePosition = shrinePosition;
    this.rng = Math.random;

    this.followers = Array.from({ length: count }, () => ({
      position: pickWanderTarget(this.rng, WANDER_BOUNDS),
      target: pickWanderTarget(this.rng, WANDER_BOUNDS),
      state: FOLLOWER_STATES.WANDER,
    }));

    const geometry = new THREE.ConeGeometry(0.4, 1.2, 6);
    const material = new THREE.MeshStandardMaterial({ color: 0xf2e6d8 });
    this.instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    scene.add(this.instancedMesh);

    this._matrix = new THREE.Matrix4();
    this._syncInstances();
  }

  update(dt) {
    for (const follower of this.followers) {
      const dx = follower.position.x - this.shrinePosition.x;
      const dz = follower.position.z - this.shrinePosition.z;
      const distanceToShrine = Math.sqrt(dx * dx + dz * dz);

      follower.state = nextFollowerState({
        currentState: follower.state,
        distanceToShrine,
        worshipRadius: WORSHIP_RADIUS,
      });

      if (follower.state === FOLLOWER_STATES.WANDER) {
        follower.position = stepTowards(follower.position, follower.target, WANDER_SPEED, dt);
        const dxT = follower.target.x - follower.position.x;
        const dzT = follower.target.z - follower.position.z;
        if (Math.sqrt(dxT * dxT + dzT * dzT) < 0.5) {
          follower.target = pickWanderTarget(this.rng, WANDER_BOUNDS);
        }
      }
    }
    this._syncInstances();
  }

  _syncInstances() {
    this.followers.forEach((follower, i) => {
      const y = this.terrain.getHeightAt(follower.position.x, follower.position.z);
      this._matrix.makeTranslation(follower.position.x, y + 0.6, follower.position.z);
      this.instancedMesh.setMatrixAt(i, this._matrix);
    });
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  getWorshipperCount() {
    return this.followers.filter((f) => f.state === FOLLOWER_STATES.WORSHIP).length;
  }

  getPopulation() {
    return this.followers.length;
  }
}
