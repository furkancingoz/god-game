import * as THREE from 'three';
import { determineSculptMode } from './sculptInput.js';

const SCULPT_RADIUS = 4;
const SCULPT_STRENGTH = 0.15;

export class GodHand {
  constructor({ camera, domElement, terrain, scene }) {
    this.camera = camera;
    this.domElement = domElement;
    this.terrain = terrain;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.isSculpting = false;
    this.sculptMode = null;
    this.sculptingEnabled = true;

    const handGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const handMaterial = new THREE.MeshStandardMaterial({
      color: 0xffe9a8,
      emissive: 0xffcf5c,
      emissiveIntensity: 0.4,
    });
    this.handMesh = new THREE.Mesh(handGeometry, handMaterial);
    this.handMesh.visible = false;
    scene.add(this.handMesh);

    domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    domElement.addEventListener('pointerdown', (e) => this._onPointerDown(e));
    domElement.addEventListener('pointermove', (e) => this._onPointerMove(e));
    window.addEventListener('pointerup', () => this._onPointerUp());
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
    if (!this.sculptingEnabled) return;
    this.sculptMode = determineSculptMode({ button: event.button, shiftKey: event.shiftKey });
    if (this.sculptMode) this.isSculpting = true;
  }

  _onPointerMove(event) {
    this._updatePointer(event);
    const point = this._raycastToTerrain();
    if (point) {
      this.handMesh.visible = true;
      this.handMesh.position.set(point.x, point.y + 1, point.z);
      if (this.isSculpting && this.sculptMode) {
        this._sculptAt(point);
      }
    } else {
      this.handMesh.visible = false;
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
