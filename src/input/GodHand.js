import * as THREE from 'three';
import { determineSculptMode } from './sculptInput.js';

export const SCULPT_RADIUS = 4;
export const SCULPT_STRENGTH = 0.15;

export class GodHand {
  constructor({ camera, domElement, terrain, scene }) {
    this.camera = camera;
    this.domElement = domElement;
    this.terrain = terrain;
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.isSculpting = false;
    this.sculptMode = null;
    this.sculptingEnabled = true;
    this.activePower = 'sculpt'; // 'sculpt', 'rain', 'sun', 'fire', 'bless'

    // Divine glowing hand orb
    const handGeometry = new THREE.SphereGeometry(0.7, 16, 16);
    const handMaterial = new THREE.MeshStandardMaterial({
      color: 0xffea78,
      emissive: 0xffb700,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });
    this.handMesh = new THREE.Mesh(handGeometry, handMaterial);
    this.handMesh.visible = false;
    scene.add(this.handMesh);

    // Divine light source attached to hand
    this.handLight = new THREE.PointLight(0xffcc44, 2, 12);
    this.handMesh.add(this.handLight);

    // Divine influence radius ring indicator on ground
    const ringGeo = new THREE.RingGeometry(SCULPT_RADIUS - 0.2, SCULPT_RADIUS, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    this.radiusRing = new THREE.Mesh(ringGeo, ringMat);
    this.radiusRing.visible = false;
    scene.add(this.radiusRing);

    domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    domElement.addEventListener('pointerdown', (e) => this._onPointerDown(e));
    domElement.addEventListener('pointermove', (e) => this._onPointerMove(e));
    window.addEventListener('pointerup', () => this._onPointerUp());
  }

  setPower(power) {
    this.activePower = power;
    if (power === 'sculpt') {
      this.radiusRing.material.color.setHex(0xffd700); // Gold
    } else if (power === 'rain') {
      this.radiusRing.material.color.setHex(0x38b6ff); // Cyan
    } else if (power === 'sun') {
      this.radiusRing.material.color.setHex(0xff9900); // Orange
    } else if (power === 'fire') {
      this.radiusRing.material.color.setHex(0xff3300); // Red
    } else if (power === 'bless') {
      this.radiusRing.material.color.setHex(0x70e000); // Green
    }
  }

  _updatePointer(event) {
    const rect = this.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  _raycastToTerrain() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObject(this.terrain.mesh);
    return hits.length > 0 ? hits[0].point : null;
  }

  _onPointerDown(event) {
    if (!this.sculptingEnabled || this.activePower !== 'sculpt') return;
    this.sculptMode = determineSculptMode({ button: event.button, shiftKey: event.shiftKey });
    if (this.sculptMode) this.isSculpting = true;
  }

  _onPointerMove(event) {
    this._updatePointer(event);
    const point = this._raycastToTerrain();
    if (point) {
      this.handMesh.visible = true;
      this.handMesh.position.set(point.x, point.y + 1.2, point.z);

      this.radiusRing.visible = true;
      this.radiusRing.position.set(point.x, point.y + 0.1, point.z);

      if (this.isSculpting && this.sculptMode && this.activePower === 'sculpt') {
        this._sculptAt(point);
      }
    } else {
      this.handMesh.visible = false;
      this.radiusRing.visible = false;
    }
  }

  _onPointerUp() {
    this.isSculpting = false;
    this.sculptMode = null;
  }

  _sculptAt(point) {
    if (this.sculptMode === 'raise') {
      this.terrain.raise(point.x, point.z, SCULPT_RADIUS, SCULPT_STRENGTH);
    } else if (this.sculptMode === 'lower') {
      this.terrain.lower(point.x, point.z, SCULPT_RADIUS, SCULPT_STRENGTH);
    }
  }
}
