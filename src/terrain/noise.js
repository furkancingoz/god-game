function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildValueNoiseGrid(size, rng) {
  const grid = new Float32Array(size * size);
  for (let i = 0; i < grid.length; i++) {
    grid[i] = rng();
  }
  return grid;
}

function sampleBilinear(grid, gridSize, x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const clampIndex = (v) => Math.max(0, Math.min(gridSize - 1, v));
  const cx0 = clampIndex(x0);
  const cy0 = clampIndex(y0);
  const x1 = clampIndex(x0 + 1);
  const y1 = clampIndex(y0 + 1);
  const sx = x - x0;
  const sy = y - y0;

  const v00 = grid[cy0 * gridSize + cx0];
  const v10 = grid[cy0 * gridSize + x1];
  const v01 = grid[y1 * gridSize + cx0];
  const v11 = grid[y1 * gridSize + x1];

  const ix0 = v00 + (v10 - v00) * sx;
  const ix1 = v01 + (v11 - v01) * sx;
  return ix0 + (ix1 - ix0) * sy;
}

export function generateHeightmap({ width, height, seed = 1 }) {
  if (width < 2 || height < 2) {
    throw new Error('generateHeightmap requires width and height >= 2');
  }

  const rng = mulberry32(seed);
  const noiseGridSize = 8;
  const noiseGrid = buildValueNoiseGrid(noiseGridSize, rng);

  const heightmap = new Float32Array(width * height);
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const maxDist = Math.min(cx, cy);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = (x / (width - 1)) * (noiseGridSize - 1);
      const ny = (y / (height - 1)) * (noiseGridSize - 1);
      const noiseValue = sampleBilinear(noiseGrid, noiseGridSize, nx, ny);

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
      const falloff = Math.max(0, 1 - dist * dist);

      heightmap[y * width + x] = noiseValue * falloff;
    }
  }

  return heightmap;
}
