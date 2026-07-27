import * as THREE from 'three';

export class EnvironmentSystem {
  constructor({ scene, terrain, treeCount = 60, rockCount = 30 }) {
    this.terrain = terrain;
    this.scene = scene;
    this.trees = [];

    this._spawnTrees(scene, terrain, treeCount);
    this._spawnRocks(scene, terrain, rockCount);
  }

  _spawnTrees(scene, terrain, count) {
    const trunkGeo = new THREE.CylinderGeometry(0.15, 0.25, 1.2, 5);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, flatShading: true });
    
    const foliageGeo = new THREE.ConeGeometry(0.9, 2.2, 5);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2e7329, flatShading: true });

    const treeGroup = new THREE.Group();

    let spawned = 0;
    let attempts = 0;
    const bounds = terrain.worldSize * 0.4;

    while (spawned < count && attempts < 300) {
      attempts++;
      const x = (Math.random() * 2 - 1) * bounds;
      const z = (Math.random() * 2 - 1) * bounds;
      const h = terrain.getHeightAt(x, z);

      // Spawn trees only on grass elevation (0.8m to 5.0m)
      if (h > 0.8 && h < 5.0) {
        const tree = new THREE.Group();

        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 0.6;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        tree.add(trunk);

        const foliage = new THREE.Mesh(foliageGeo, foliageMat);
        foliage.position.y = 2.0;
        foliage.castShadow = true;
        foliage.receiveShadow = true;
        tree.add(foliage);

        tree.position.set(x, h, z);
        const scale = 0.7 + Math.random() * 0.6;
        tree.scale.set(scale, scale, scale);
        tree.rotation.y = Math.random() * Math.PI * 2;

        treeGroup.add(tree);
        this.trees.push({ group: tree, basePosY: h, phase: Math.random() * Math.PI * 2 });
        spawned++;
      }
    }
    scene.add(treeGroup);
  }

  _spawnRocks(scene, terrain, count) {
    const rockGeo = new THREE.DodecahedronGeometry(0.6, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x757d8a, flatShading: true });
    const rockGroup = new THREE.Group();

    let spawned = 0;
    let attempts = 0;
    const bounds = terrain.worldSize * 0.42;

    while (spawned < count && attempts < 300) {
      attempts++;
      const x = (Math.random() * 2 - 1) * bounds;
      const z = (Math.random() * 2 - 1) * bounds;
      const h = terrain.getHeightAt(x, z);

      if (h > 0.4) {
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(x, h + 0.2, z);
        const s = 0.5 + Math.random() * 0.8;
        rock.scale.set(s * (0.8 + Math.random() * 0.4), s, s * (0.8 + Math.random() * 0.4));
        rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        rock.castShadow = true;
        rock.receiveShadow = true;
        rockGroup.add(rock);
        spawned++;
      }
    }
    scene.add(rockGroup);
  }

  update(time) {
    // Gentle tree sway in the wind
    for (const tree of this.trees) {
      const currentH = this.terrain.getHeightAt(tree.group.position.x, tree.group.position.z);
      tree.group.position.y = currentH;
      tree.group.rotation.z = Math.sin(time * 2 + tree.phase) * 0.04;
      tree.group.rotation.x = Math.cos(time * 1.5 + tree.phase) * 0.03;
    }
  }
}
