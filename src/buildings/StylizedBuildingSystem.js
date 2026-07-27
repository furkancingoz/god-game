import * as THREE from 'three';

export class StylizedBuildingSystem {
  constructor({ scene, terrain }) {
    this.scene = scene;
    this.terrain = terrain;
    this.huts = [];
    this.hutGroup = new THREE.Group();
    scene.add(this.hutGroup);

    // House Base Materials & Geometries
    this.stoneBaseGeo = new THREE.BoxGeometry(1.6, 0.4, 1.6);
    this.stoneBaseMat = new THREE.MeshStandardMaterial({ color: 0x475569, flatShading: true });

    this.timberWallsGeo = new THREE.BoxGeometry(1.5, 1.1, 1.5);
    this.timberWallsMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, flatShading: true });

    this.roofGeo = new THREE.ConeGeometry(1.3, 1.0, 4);
    this.roofMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, flatShading: true });

    this.chimneyGeo = new THREE.BoxGeometry(0.3, 0.9, 0.3);
    this.chimneyMat = new THREE.MeshStandardMaterial({ color: 0x334155, flatShading: true });

    this.windowMat = new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xeab308, emissiveIntensity: 0.8 });
    this.windowGeo = new THREE.BoxGeometry(0.35, 0.35, 0.05);

    // Chimney Smoke Particles
    this.smokeParticles = [];
  }

  buildHutAt(x, z) {
    const y = this.terrain.getHeightAt(x, z);
    if (y < 0.6) return null; // Don't build in water

    for (const hut of this.huts) {
      const dx = hut.position.x - x;
      const dz = hut.position.z - z;
      if (Math.sqrt(dx * dx + dz * dz) < 2.8) return null;
    }

    const house = new THREE.Group();

    // 1. Stone Foundation
    const stoneBase = new THREE.Mesh(this.stoneBaseGeo, this.stoneBaseMat);
    stoneBase.position.y = 0.2;
    stoneBase.castShadow = true;
    stoneBase.receiveShadow = true;
    house.add(stoneBase);

    // 2. Timber Walls
    const timber = new THREE.Mesh(this.timberWallsGeo, this.timberWallsMat);
    timber.position.y = 0.95;
    timber.castShadow = true;
    timber.receiveShadow = true;
    house.add(timber);

    // 3. Pitched Roof
    const roof = new THREE.Mesh(this.roofGeo, this.roofMat);
    roof.position.y = 2.0;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    house.add(roof);

    // 4. Stone Chimney
    const chimney = new THREE.Mesh(this.chimneyGeo, this.chimneyMat);
    chimney.position.set(0.5, 2.1, 0.3);
    chimney.castShadow = true;
    house.add(chimney);

    // 5. Glowing Windows
    const win1 = new THREE.Mesh(this.windowGeo, this.windowMat);
    win1.position.set(0, 1.0, 0.77);
    house.add(win1);

    house.position.set(x, y, z);
    house.scale.set(0, 0, 0);
    this.hutGroup.add(house);

    const hutData = { group: house, position: { x, z }, scale: 0, targetScale: 1.0 };
    this.huts.push(hutData);
    return hutData;
  }

  update(dt) {
    for (const hut of this.huts) {
      if (hut.scale < hut.targetScale) {
        hut.scale = Math.min(hut.targetScale, hut.scale + dt * 2.5);
        hut.group.scale.set(hut.scale, hut.scale, hut.scale);
      }
      const y = this.terrain.getHeightAt(hut.position.x, hut.position.z);
      hut.group.position.y = y;
    }
  }

  getHutCount() {
    return this.huts.length;
  }
}
