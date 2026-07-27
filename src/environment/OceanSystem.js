import * as THREE from 'three';

export class OceanSystem {
  constructor({ scene, worldSize = 100 }) {
    this.worldSize = worldSize;
    this.geometry = new THREE.PlaneGeometry(worldSize * 2, worldSize * 2, 64, 64);
    this.geometry.rotateX(-Math.PI / 2);

    this.material = new THREE.MeshStandardMaterial({
      color: 0x1c86d1,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.78,
      flatShading: true,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.y = 0.6; // Sea level height
    this.mesh.receiveShadow = true;
    scene.add(this.mesh);

    // Initial position backup for wave animation
    this.initialPositions = new Float32Array(this.geometry.attributes.position.array);
  }

  update(time) {
    const position = this.geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const u = position.getX(i);
      const v = position.getZ(i);
      const wave1 = Math.sin(u * 0.15 + time * 1.5) * 0.12;
      const wave2 = Math.cos(v * 0.2 + time * 1.2) * 0.08;
      position.setY(i, this.initialPositions[i * 3 + 1] + wave1 + wave2);
    }
    position.needsUpdate = true;
  }
}
