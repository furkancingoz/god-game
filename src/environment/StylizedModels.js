import * as THREE from 'three';

export class DivineAltarSystem {
  constructor({ scene, terrain }) {
    this.scene = scene;
    this.terrain = terrain;

    const y = terrain.getHeightAt(0, 0);

    this.group = new THREE.Group();
    this.group.position.set(0, y, 0);

    // Stone Steps Altar
    const step1Geo = new THREE.CylinderGeometry(2.4, 2.8, 0.4, 8);
    const step2Geo = new THREE.CylinderGeometry(1.6, 2.0, 0.4, 8);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7, flatShading: true });

    const step1 = new THREE.Mesh(step1Geo, stoneMat);
    step1.position.y = 0.2;
    step1.castShadow = true;
    step1.receiveShadow = true;
    this.group.add(step1);

    const step2 = new THREE.Mesh(step2Geo, stoneMat);
    step2.position.y = 0.6;
    step2.castShadow = true;
    step2.receiveShadow = true;
    this.group.add(step2);

    // Floating Divine Crystal
    const crystalGeo = new THREE.OctahedronGeometry(1.0, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffaa00,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.8,
    });
    this.crystal = new THREE.Mesh(crystalGeo, crystalMat);
    this.crystal.position.y = 2.4;
    this.crystal.castShadow = true;
    this.group.add(this.crystal);

    // Divine Light from Crystal
    const crystalLight = new THREE.PointLight(0xffd700, 2.5, 15);
    crystalLight.position.y = 2.4;
    this.group.add(crystalLight);

    scene.add(this.group);
  }

  update(time) {
    const y = this.terrain.getHeightAt(0, 0);
    this.group.position.y = y;
    this.crystal.rotation.y = time * 1.2;
    this.crystal.position.y = 2.4 + Math.sin(time * 2.0) * 0.15;
  }
}

export class StylizedTreeSystem {
  constructor({ scene, terrain, treeCount = 75 }) {
    this.terrain = terrain;
    this.trees = [];

    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.32, 1.4, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3222, flatShading: true });

    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.8, flatShading: true });

    const treeGroup = new THREE.Group();
    let spawned = 0;
    let attempts = 0;
    const bounds = terrain.worldSize * 0.42;

    while (spawned < treeCount && attempts < 400) {
      attempts++;
      const x = (Math.random() * 2 - 1) * bounds;
      const z = (Math.random() * 2 - 1) * bounds;
      const h = terrain.getHeightAt(x, z);

      if (h > 0.8 && h < 5.2) {
        const tree = new THREE.Group();

        // Trunk
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 0.7;
        trunk.castShadow = true;
        tree.add(trunk);

        // Layered Foliage (3 stacked spheres for stylized oak/pine look)
        const f1 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 1), foliageMat);
        f1.position.y = 1.8;
        f1.castShadow = true;
        tree.add(f1);

        const f2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 1), foliageMat);
        f2.position.y = 2.5;
        f2.castShadow = true;
        tree.add(f2);

        const f3 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), foliageMat);
        f3.position.y = 3.1;
        f3.castShadow = true;
        tree.add(f3);

        tree.position.set(x, h, z);
        const s = 0.65 + Math.random() * 0.5;
        tree.scale.set(s, s, s);
        tree.rotation.y = Math.random() * Math.PI * 2;

        treeGroup.add(tree);
        this.trees.push({ group: tree, phase: Math.random() * Math.PI * 2 });
        spawned++;
      }
    }
    scene.add(treeGroup);
  }

  update(time) {
    for (const tree of this.trees) {
      tree.group.rotation.z = Math.sin(time * 1.8 + tree.phase) * 0.03;
    }
  }
}
