import * as THREE from 'three';

export class FarmSystem {
  constructor({ scene, terrain }) {
    this.scene = scene;
    this.terrain = terrain;
    this.farms = [];
    this.farmGroup = new THREE.Group();
    scene.add(this.farmGroup);

    this.cropGeo = new THREE.BoxGeometry(0.3, 0.6, 0.3);
    this.cropMat = new THREE.MeshStandardMaterial({ color: 0xe6b800, flatShading: true }); // Gold Wheat
  }

  createFarmPlot(x, z) {
    const y = this.terrain.getHeightAt(x, z);
    if (y < 0.7) return null; // Don't farm in water

    // Check overlap
    for (const farm of this.farms) {
      const dx = farm.position.x - x;
      const dz = farm.position.z - z;
      if (Math.sqrt(dx * dx + dz * dz) < 3.0) return null;
    }

    const farmPlot = new THREE.Group();
    // Soil bed
    const soilGeo = new THREE.BoxGeometry(2.5, 0.1, 2.5);
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x4a2e16, roughness: 0.9 });
    const soil = new THREE.Mesh(soilGeo, soilMat);
    soil.position.y = 0.05;
    soil.receiveShadow = true;
    farmPlot.add(soil);

    // Wheat crops grid (3x3)
    const crops = [];
    for (let cx = -0.8; cx <= 0.8; cx += 0.8) {
      for (let cz = -0.8; cz <= 0.8; cz += 0.8) {
        const crop = new THREE.Mesh(this.cropGeo, this.cropMat);
        crop.position.set(cx, 0.35, cz);
        crop.scale.set(0.1, 0.1, 0.1);
        crop.castShadow = true;
        farmPlot.add(crop);
        crops.push(crop);
      }
    }

    farmPlot.position.set(x, y, z);
    this.farmGroup.add(farmPlot);

    const farmData = { group: farmPlot, position: { x, z }, crops, growth: 0.2 };
    this.farms.push(farmData);
    return farmData;
  }

  boostGrowthNear(centerPoint, radius) {
    for (const farm of this.farms) {
      const dx = farm.position.x - centerPoint.x;
      const dz = farm.position.z - centerPoint.z;
      if (Math.sqrt(dx * dx + dz * dz) <= radius) {
        farm.growth = Math.min(1.0, farm.growth + 0.4);
      }
    }
  }

  update(dt) {
    for (const farm of this.farms) {
      if (farm.growth < 1.0) {
        farm.growth = Math.min(1.0, farm.growth + dt * 0.05);
        for (const crop of farm.crops) {
          const s = farm.growth;
          crop.scale.set(s, s, s);
          crop.position.y = 0.3 * s;
        }
      }
      const y = this.terrain.getHeightAt(farm.position.x, farm.position.z);
      farm.group.position.y = y;
    }
  }
}
