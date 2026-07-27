import * as THREE from 'three';
import { generateHeightmap } from './noise.js';

export const WORLD_SIZE = 50;
export const GRID_SIZE = 128;

export function sampleHeight(heightmap, gridWidth, gridHeight, gx, gz) {
  const x0 = Math.floor(gx);
  const z0 = Math.floor(gz);
  const clampX = (v) => Math.max(0, Math.min(gridWidth - 1, v));
  const clampZ = (v) => Math.max(0, Math.min(gridHeight - 1, v));
  const cx0 = clampX(x0);
  const cz0 = clampZ(z0);
  const x1 = clampX(x0 + 1);
  const z1 = clampZ(z0 + 1);
  const sx = gx - x0;
  const sz = gz - z0;

  const h00 = heightmap[cz0 * gridWidth + cx0];
  const h10 = heightmap[cz0 * gridWidth + x1];
  const h01 = heightmap[z1 * gridWidth + cx0];
  const h11 = heightmap[z1 * gridWidth + x1];

  const hx0 = h00 + (h10 - h00) * sx;
  const hx1 = h01 + (h11 - h01) * sx;
  return hx0 + (hx1 - hx0) * sz;
}

export function applySculpt(heightmap, gridWidth, gridHeight, cx, cz, radius, strength) {
  const minGx = Math.max(0, Math.floor(cx - radius));
  const maxGx = Math.min(gridWidth - 1, Math.ceil(cx + radius));
  const minGz = Math.max(0, Math.floor(cz - radius));
  const maxGz = Math.min(gridHeight - 1, Math.ceil(cz + radius));

  for (let gz = minGz; gz <= maxGz; gz++) {
    for (let gx = minGx; gx <= maxGx; gx++) {
      const dx = gx - cx;
      const dz = gz - cz;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > radius) continue;
      const falloff = 1 - dist / radius;
      const index = gz * gridWidth + gx;
      const newValue = heightmap[index] + strength * falloff;
      heightmap[index] = Math.max(0, Math.min(2, newValue));
    }
  }
}

export class TerrainSystem {
  constructor({ gridSize = GRID_SIZE, worldSize = WORLD_SIZE, seed = 1 } = {}) {
    this.gridSize = gridSize;
    this.worldSize = worldSize;
    this.heightmap = generateHeightmap({ width: gridSize, height: gridSize, seed });

    this.geometry = new THREE.PlaneGeometry(worldSize, worldSize, gridSize - 1, gridSize - 1);
    this.geometry.rotateX(-Math.PI / 2);
    this.material = new THREE.MeshStandardMaterial({ color: 0x4a7c3a, flatShading: true });
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    this._syncGeometryFromHeightmap();
  }

  _worldToGrid(x, z) {
    const gx = ((x + this.worldSize / 2) / this.worldSize) * (this.gridSize - 1);
    const gz = ((this.worldSize / 2 - z) / this.worldSize) * (this.gridSize - 1);
    return { gx, gz };
  }

  _syncGeometryFromHeightmap() {
    const position = this.geometry.attributes.position;
    for (let i = 0; i < this.heightmap.length; i++) {
      position.setY(i, this.heightmap[i] * 5);
    }
    position.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  getHeightAt(x, z) {
    const { gx, gz } = this._worldToGrid(x, z);
    return sampleHeight(this.heightmap, this.gridSize, this.gridSize, gx, gz) * 5;
  }

  raise(x, z, radius, strength) {
    const { gx, gz } = this._worldToGrid(x, z);
    const gridRadius = (radius / this.worldSize) * (this.gridSize - 1);
    applySculpt(this.heightmap, this.gridSize, this.gridSize, gx, gz, gridRadius, Math.abs(strength));
    this._syncGeometryFromHeightmap();
  }

  lower(x, z, radius, strength) {
    const { gx, gz } = this._worldToGrid(x, z);
    const gridRadius = (radius / this.worldSize) * (this.gridSize - 1);
    applySculpt(this.heightmap, this.gridSize, this.gridSize, gx, gz, gridRadius, -Math.abs(strength));
    this._syncGeometryFromHeightmap();
  }
}
