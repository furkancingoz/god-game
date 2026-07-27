import * as THREE from 'three';

export class BuildingSystem {
  constructor({ scene, terrain }) {
    this.scene = scene;
    this.terrain = terrain;
    this.huts = [];
    this.hutGroup = new THREE.Group();
    scene.add(this.hutGroup);

    // Hut template geometries
    this.wallGeo = new THREE.BoxGeometry(1.4, 1.0, 1.4);
    this.wallMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, flatShading: true });

    this.roofGeo = new THREE.ConeGeometry(1.2, 0.9, 4);
    this.roofMat = new THREE.MeshStandardMaterial({ color: 0xcc7a00, flatShading: true });
  }

  buildHutAt(x, z) {
    const y = this.terrain.getHeightAt(x, z);
    if (y < 0.6) return null; // Don't build in water

    // Check distance to existing huts to prevent overlap
    for (const hut of this.huts) {
      const dx = hut.position.x - x;
      const dz = hut.position.z - z;
      if (Math.sqrt(dx * dx + dz * dz) < 2.5) {
        return null;
      }
    }

    const hut = new THREE.Group();

    const walls = new THREE.Mesh(this.wallGeo, this.wallMat);
    walls.position.y = 0.5;
    walls.castShadow = true;
    walls.receiveShadow = true;
    hut.add(walls);

    const roof = new THREE.Mesh(this.roofGeo, this.roofMat);
    roof.position.y = 1.45;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    roof.receiveShadow = true;
    hut.add(roof);

    hut.position.set(x, y, z);
    hut.scale.set(0, 0, 0); // Spawning scale animation
    this.hutGroup.add(hut);

    const hutData = { group: hut, position: { x, z }, scale: 0, targetScale: 1.0 };
    this.huts.push(hutData);
    return hutData;
  }

  update(dt) {
    for (const hut of this.huts) {
      if (hut.scale < hut.targetScale) {
        hut.scale = Math.min(hut.targetScale, hut.scale + dt * 2);
        hut.group.scale.set(hut.scale, hut.scale, hut.scale);
      }
      // Keep height synced with terrain
      const currentH = this.terrain.getHeightAt(hut.position.x, hut.position.z);
      hut.group.position.y = currentH;
    }
  }

  getHutCount() {
    return this.huts.length;
  }
}
