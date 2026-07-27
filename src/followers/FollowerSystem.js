import * as THREE from 'three';
import { FOLLOWER_STATES, nextFollowerState, stepTowards, pickWanderTarget, generateFollowerProfile } from './followerLogic.js';

const WANDER_SPEED = 1.6;
const WORSHIP_RADIUS = 6;
const WANDER_BOUNDS = 18;

export class FollowerSystem {
  constructor({ scene, terrain, count = 24, shrinePosition = { x: 0, z: 0 } }) {
    this.scene = scene;
    this.terrain = terrain;
    this.shrinePosition = shrinePosition;
    this.rng = Math.random;
    this.prophet = null;
    this.selectedFollower = null;

    this.followers = Array.from({ length: count }, (_, i) => ({
      ...generateFollowerProfile(i),
      position: pickWanderTarget(this.rng, WANDER_BOUNDS),
      target: pickWanderTarget(this.rng, WANDER_BOUNDS),
      state: FOLLOWER_STATES.WANDER,
    }));

    // Follower mesh group
    this.followerGroup = new THREE.Group();
    scene.add(this.followerGroup);

    // Humanoid Body & Head geometries
    this.headGeo = new THREE.SphereGeometry(0.25, 8, 8);
    this.bodyGeo = new THREE.CylinderGeometry(0.2, 0.35, 0.9, 6);

    this.bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, flatShading: true });
    this.prophetBodyMat = new THREE.MeshStandardMaterial({ color: 0xeab308, emissive: 0xca8a04, emissiveIntensity: 0.4 });
    this.headMat = new THREE.MeshStandardMaterial({ color: 0xfde047 });

    this.followerMeshes = [];
    this._createFollowerMeshes();

    // Prophet Aura Ring
    const auraGeo = new THREE.RingGeometry(0.8, 1.2, 16);
    auraGeo.rotateX(-Math.PI / 2);
    const auraMat = new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
    this.prophetAura = new THREE.Mesh(auraGeo, auraMat);
    this.prophetAura.visible = false;
    scene.add(this.prophetAura);

    // Prophet Divine Light
    this.prophetLight = new THREE.PointLight(0xffd700, 1.5, 8);
    this.prophetLight.visible = false;
    scene.add(this.prophetLight);
  }

  _createFollowerMeshes() {
    this.followers.forEach((f, i) => {
      const personGroup = new THREE.Group();

      const body = new THREE.Mesh(this.bodyGeo, this.bodyMat);
      body.position.y = 0.45;
      body.castShadow = true;
      body.receiveShadow = true;
      personGroup.add(body);

      const head = new THREE.Mesh(this.headGeo, this.headMat);
      head.position.y = 1.05;
      head.castShadow = true;
      personGroup.add(head);

      personGroup.userData = { followerIndex: i };
      this.followerGroup.add(personGroup);
      this.followerMeshes.push(personGroup);
    });
  }

  makeProphet(follower) {
    if (!follower) return;
    if (this.prophet) {
      this.prophet.isProphet = false;
      this.prophet.role = 'Worshipper';
    }
    follower.isProphet = true;
    follower.role = 'PEYGAMBER';
    follower.devotion = 100;
    this.prophet = follower;

    // Highlight prophet mesh
    const idx = this.followers.indexOf(follower);
    if (idx !== -1 && this.followerMeshes[idx]) {
      const body = this.followerMeshes[idx].children[0];
      body.material = this.prophetBodyMat;
    }
  }

  update(dt) {
    for (let i = 0; i < this.followers.length; i++) {
      const follower = this.followers[i];
      const meshGroup = this.followerMeshes[i];

      // Needs decay
      follower.hunger = Math.max(0, follower.hunger - dt * 0.2);
      follower.energy = Math.max(0, follower.energy - dt * 0.1);

      const dx = follower.position.x - this.shrinePosition.x;
      const dz = follower.position.z - this.shrinePosition.z;
      const distanceToShrine = Math.sqrt(dx * dx + dz * dz);

      follower.state = nextFollowerState({
        currentState: follower.state,
        distanceToShrine,
        worshipRadius: WORSHIP_RADIUS,
        isProphet: follower.isProphet,
      });

      if (follower.state === FOLLOWER_STATES.WANDER) {
        follower.position = stepTowards(follower.position, follower.target, WANDER_SPEED, dt);
        const dxT = follower.target.x - follower.position.x;
        const dzT = follower.target.z - follower.position.z;
        if (Math.sqrt(dxT * dxT + dzT * dzT) < 0.5) {
          follower.target = pickWanderTarget(this.rng, WANDER_BOUNDS);
        }
      } else if (follower.state === FOLLOWER_STATES.PROPHET_PREACH) {
        // Prophet preaches at shrine
        follower.position = stepTowards(follower.position, { x: 0, z: 2.5 }, WANDER_SPEED, dt);
      }

      // Sync 3D Mesh
      const y = this.terrain.getHeightAt(follower.position.x, follower.position.z);
      meshGroup.position.set(follower.position.x, y, follower.position.z);

      // Walking bobbing animation
      if (follower.state === FOLLOWER_STATES.WANDER) {
        meshGroup.rotation.z = Math.sin(Date.now() * 0.01 + i) * 0.1;
      } else {
        meshGroup.rotation.z = 0;
      }

      // Sync Prophet Aura & Light
      if (follower.isProphet) {
        this.prophetAura.visible = true;
        this.prophetAura.position.set(follower.position.x, y + 0.1, follower.position.z);

        this.prophetLight.visible = true;
        this.prophetLight.position.set(follower.position.x, y + 2.0, follower.position.z);
      }
    }
  }

  getWorshipperCount() {
    return this.followers.filter((f) => f.state === FOLLOWER_STATES.WORSHIP || f.isProphet).length;
  }

  getPopulation() {
    return this.followers.length;
  }
}
