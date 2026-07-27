# God Game MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable browser MVP of a top-down god-game (Godus/Populous/Black & White inspired): sculpt an island, guide followers, cast a rain miracle, watch a faith counter grow.

**Architecture:** Vanilla Three.js + Vite, no framework. Pure game-logic functions (heightmap math, follower state machine, faith accrual, miracle radius checks, sculpt input mapping) live in standalone modules with no Three.js/DOM dependency so they're unit-testable with Vitest. Three.js-dependent classes (meshes, raycasting, InstancedMesh) wrap those pure functions for rendering/interaction and are verified manually in the browser plus one Playwright smoke test at the end.

**Tech Stack:** Three.js, Vite, Vitest, @playwright/test (added in Task 10).

## Global Constraints

- Node ESM project (`"type": "module"` in package.json).
- Install dependencies with `npm install <pkg>` (no dev) / `npm install -D <pkg>` (dev) so npm resolves and pins current versions itself — do not hand-write version numbers into package.json.
- Pure logic modules (noise, terrain math, follower state machine, faith math, miracle radius check, sculpt input mapping) must have zero imports from `three` or the DOM, and must be covered by Vitest tests.
- All player-facing text (HUD) is in Turkish.
- Every task must leave `npm run dev` in a working, visually-inspectable state. Never commit a task that breaks the dev server.
- World coordinate system: island spans `-worldSize/2..worldSize/2` on both X and Z, `worldSize = 50`. Heightmap grid is `gridSize = 128` per side.

---

### Task 1: Project scaffold (Vite + Three.js, empty scene renders)

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `src/main.js`
- Create: `.gitignore` (already exists from design-doc commit — verify it covers `node_modules/`)

**Interfaces:**
- Produces: a running Vite dev server that renders a full-window `<canvas>` with a sky-blue background. Later tasks import `three` and append to the DOM the same way `src/main.js` does here.

- [ ] **Step 1: Write package.json**

```json
{
  "name": "god-game",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run"
  }
}
```

- [ ] **Step 2: Install runtime and dev dependencies**

```bash
npm install three
npm install -D vite vitest
```

Expected: `package.json` now has `three` under `dependencies` and `vite`, `vitest` under `devDependencies` with npm-resolved version numbers.

- [ ] **Step 3: Write index.html**

```html
<!doctype html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <title>Tanrı Oyunu</title>
  <style>
    html, body { margin: 0; padding: 0; overflow: hidden; background: #0a0a12; }
    canvas { display: block; }
  </style>
</head>
<body>
  <div id="hud"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: Write src/main.js**

```js
import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 20);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
```

- [ ] **Step 5: Verify the dev server serves the page**

```bash
npm run dev &
sleep 2
curl -sf http://localhost:5173/ | grep -q 'id="hud"' && echo "SERVER_OK"
kill %1
```

Expected: prints `SERVER_OK`.

- [ ] **Step 6: Manual browser check**

Run `npm run dev`, open `http://localhost:5173` in a browser. Expected: full-window sky-blue canvas, no console errors. Stop the server (Ctrl+C).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json index.html src/main.js
git commit -m "feat: scaffold Vite + Three.js project with empty scene"
git push
```

---

### Task 2: Island heightmap generation (pure, TDD)

**Files:**
- Create: `src/terrain/noise.js`
- Test: `src/terrain/noise.test.js`

**Interfaces:**
- Produces: `generateHeightmap({ width, height, seed }) -> Float32Array` of length `width * height`, row-major (`index = y * width + x`), values in `[0, 1]`, higher near the center (island falloff). Consumed by `TerrainSystem` in Task 3.

- [ ] **Step 1: Write the failing tests**

```js
// src/terrain/noise.test.js
import { describe, it, expect } from 'vitest';
import { generateHeightmap } from './noise.js';

describe('generateHeightmap', () => {
  it('returns a Float32Array of length width * height', () => {
    const map = generateHeightmap({ width: 16, height: 16, seed: 42 });
    expect(map).toBeInstanceOf(Float32Array);
    expect(map.length).toBe(256);
  });

  it('produces deterministic output for the same seed', () => {
    const a = generateHeightmap({ width: 16, height: 16, seed: 7 });
    const b = generateHeightmap({ width: 16, height: 16, seed: 7 });
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  it('produces different output for different seeds', () => {
    const a = generateHeightmap({ width: 16, height: 16, seed: 7 });
    const b = generateHeightmap({ width: 16, height: 16, seed: 8 });
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });

  it('keeps all values within the 0..1 range', () => {
    const map = generateHeightmap({ width: 32, height: 32, seed: 3 });
    for (const value of map) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('is higher near the center than at the edges (island falloff)', () => {
    const width = 32;
    const height = 32;
    const map = generateHeightmap({ width, height, seed: 3 });
    const centerValue = map[Math.floor(height / 2) * width + Math.floor(width / 2)];
    const edgeValue = map[0];
    expect(centerValue).toBeGreaterThan(edgeValue);
  });

  it('throws for widths or heights smaller than 2', () => {
    expect(() => generateHeightmap({ width: 1, height: 16 })).toThrow();
    expect(() => generateHeightmap({ width: 16, height: 1 })).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/terrain/noise.test.js
```

Expected: FAIL — `noise.js` does not exist / `generateHeightmap` is not exported.

- [ ] **Step 3: Write the implementation**

```js
// src/terrain/noise.js
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/terrain/noise.test.js
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/terrain/noise.js src/terrain/noise.test.js
git commit -m "feat: add procedural island heightmap generation"
git push
```

---

### Task 3: TerrainSystem — mesh, sculpting API, height queries

**Files:**
- Create: `src/terrain/TerrainSystem.js`
- Test: `src/terrain/TerrainSystem.test.js`

**Interfaces:**
- Consumes: `generateHeightmap` from Task 2 (`src/terrain/noise.js`).
- Produces:
  - Pure functions `sampleHeight(heightmap, gridWidth, gridHeight, gx, gz) -> number` and `applySculpt(heightmap, gridWidth, gridHeight, cx, cz, radius, strength)` (mutates in place), exported for direct testing.
  - Class `TerrainSystem` with `.mesh` (THREE.Mesh), `.raise(worldX, worldZ, radius, strength)`, `.lower(worldX, worldZ, radius, strength)`, `.getHeightAt(worldX, worldZ) -> number`. Consumed by `GodHand` (Task 5), `FollowerSystem` (Task 7), and `main.js` (Task 10).

> **Note on the rotation gotcha:** `PlaneGeometry` is built in the XY plane (`iy` runs along local Y) and then rotated `-90°` around X to lie flat. That rotation sends local `+Y` to world `-Z`, so vertex row `iy = 0` ends up at world `z = +worldSize/2`, not `-worldSize/2`. `_worldToGrid` below accounts for this — do not "simplify" it to the naive `(z + worldSize/2) / worldSize` formula or sculpting will be mirrored on the Z axis relative to what the player sees.

- [ ] **Step 1: Write the failing tests for the pure functions**

```js
// src/terrain/TerrainSystem.test.js
import { describe, it, expect } from 'vitest';
import { sampleHeight, applySculpt } from './TerrainSystem.js';

describe('sampleHeight', () => {
  it('returns exact grid value at integer coordinates', () => {
    const heightmap = new Float32Array([0, 1, 2, 3]); // 2x2 grid
    expect(sampleHeight(heightmap, 2, 2, 0, 0)).toBe(0);
    expect(sampleHeight(heightmap, 2, 2, 1, 0)).toBe(1);
    expect(sampleHeight(heightmap, 2, 2, 0, 1)).toBe(2);
    expect(sampleHeight(heightmap, 2, 2, 1, 1)).toBe(3);
  });

  it('interpolates between grid points', () => {
    const heightmap = new Float32Array([0, 10]); // 2x1 grid
    expect(sampleHeight(heightmap, 2, 1, 0.5, 0)).toBeCloseTo(5);
  });

  it('clamps out-of-range coordinates to the grid edge', () => {
    const heightmap = new Float32Array([0, 10]);
    expect(sampleHeight(heightmap, 2, 1, -5, 0)).toBe(0);
    expect(sampleHeight(heightmap, 2, 1, 5, 0)).toBe(10);
  });
});

describe('applySculpt', () => {
  it('raises the height at the center point by the full strength', () => {
    const heightmap = new Float32Array(9); // 3x3, all zeros
    applySculpt(heightmap, 3, 3, 1, 1, 1, 0.5);
    expect(heightmap[1 * 3 + 1]).toBeCloseTo(0.5);
  });

  it('leaves points outside the radius untouched', () => {
    const heightmap = new Float32Array(9);
    applySculpt(heightmap, 3, 3, 1, 1, 0.5, 0.5);
    expect(heightmap[0]).toBe(0);
  });

  it('applies a falloff so edge-of-radius points change less than the center', () => {
    const heightmap = new Float32Array(25); // 5x5
    applySculpt(heightmap, 5, 5, 2, 2, 2, 1);
    const center = heightmap[2 * 5 + 2];
    const edge = heightmap[2 * 5 + 4];
    expect(center).toBeGreaterThan(edge);
  });

  it('clamps values to the 0..2 range', () => {
    const heightmap = new Float32Array([1.9]);
    applySculpt(heightmap, 1, 1, 0, 0, 1, 1);
    expect(heightmap[0]).toBeLessThanOrEqual(2);

    const negHeightmap = new Float32Array([0.05]);
    applySculpt(negHeightmap, 1, 1, 0, 0, 1, -1);
    expect(negHeightmap[0]).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/terrain/TerrainSystem.test.js
```

Expected: FAIL — module does not exist.

- [ ] **Step 3: Write the implementation**

```js
// src/terrain/TerrainSystem.js
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
    // PlaneGeometry's rotateX(-PI/2) sends local +Y (the iy/row axis) to world -Z,
    // so row 0 sits at z = +worldSize/2. Flip z accordingly, or sculpting mirrors
    // on the Z axis relative to what's on screen.
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/terrain/TerrainSystem.test.js
```

Expected: all tests PASS.

- [ ] **Step 5: Wire into main.js and manually verify**

Add to `src/main.js` (after the renderer/lights setup, before `animate()` is defined — replace the plain scene background setup from Task 1 with this addition, keep everything else):

```js
import { TerrainSystem } from './terrain/TerrainSystem.js';
// ...
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xfff2cc, 1.1);
sunLight.position.set(20, 30, 10);
scene.add(sunLight);

const terrain = new TerrainSystem({ seed: 5 });
scene.add(terrain.mesh);
```

Run `npm run dev`, open the browser. Expected: a bumpy green island mesh visible, higher in the middle, tapering to flat/low edges. No console errors.

- [ ] **Step 6: Commit**

```bash
git add src/terrain/TerrainSystem.js src/terrain/TerrainSystem.test.js src/main.js
git commit -m "feat: add TerrainSystem with sculpting API and height queries"
git push
```

---

### Task 4: CameraRig — top-down orbit/pan/zoom camera

**Files:**
- Create: `src/camera/CameraRig.js`
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `camera` (THREE.PerspectiveCamera), `renderer.domElement` from `main.js`.
- Produces: class `CameraRig` with `.update()`, called once per frame from `main.js`'s `animate()` loop.

- [ ] **Step 1: Write CameraRig**

```js
// src/camera/CameraRig.js
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class CameraRig {
  constructor(camera, domElement) {
    this.camera = camera;
    this.controls = new OrbitControls(camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 60;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // stay above the horizon
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  update() {
    this.controls.update();
  }
}
```

- [ ] **Step 2: Wire into main.js**

Add near the top of `src/main.js`:

```js
import { CameraRig } from './camera/CameraRig.js';
```

After the `renderer` and `terrain` are created:

```js
const cameraRig = new CameraRig(camera, renderer.domElement);
```

Inside `animate()`, before `renderer.render(...)`:

```js
cameraRig.update();
```

- [ ] **Step 3: Manual verification**

Run `npm run dev`, open the browser. Expected: left-drag rotates the view around the island, right-drag (or two-finger drag) pans, scroll wheel zooms, and the camera cannot dip below the terrain's horizon plane. No console errors.

- [ ] **Step 4: Commit**

```bash
git add src/camera/CameraRig.js src/main.js
git commit -m "feat: add top-down orbit camera rig"
git push
```

---

### Task 5: God-hand sculpting input

**Files:**
- Create: `src/input/sculptInput.js`
- Test: `src/input/sculptInput.test.js`
- Create: `src/input/GodHand.js`
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `TerrainSystem` (Task 3) — calls `.raise()` / `.lower()`.
- Produces:
  - Pure function `determineSculptMode({ button, shiftKey }) -> 'raise' | 'lower' | null`.
  - Class `GodHand` with `.handMesh` (THREE.Mesh, visible when hovering terrain) and `.sculptingEnabled` (boolean, toggled by `main.js` in Task 10 to disarm sculpting while a miracle is armed).

- [ ] **Step 1: Write the failing test for the pure mapping function**

```js
// src/input/sculptInput.test.js
import { describe, it, expect } from 'vitest';
import { determineSculptMode } from './sculptInput.js';

describe('determineSculptMode', () => {
  it('returns raise for a plain left click', () => {
    expect(determineSculptMode({ button: 0, shiftKey: false })).toBe('raise');
  });
  it('returns lower for shift + left click', () => {
    expect(determineSculptMode({ button: 0, shiftKey: true })).toBe('lower');
  });
  it('returns lower for a right click', () => {
    expect(determineSculptMode({ button: 2, shiftKey: false })).toBe('lower');
  });
  it('returns null for other buttons', () => {
    expect(determineSculptMode({ button: 1, shiftKey: false })).toBe(null);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/input/sculptInput.test.js
```

Expected: FAIL — module does not exist.

- [ ] **Step 3: Write the implementation**

```js
// src/input/sculptInput.js
export function determineSculptMode({ button, shiftKey }) {
  if (button === 0 && !shiftKey) return 'raise';
  if (button === 0 && shiftKey) return 'lower';
  if (button === 2) return 'lower';
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/input/sculptInput.test.js
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Write GodHand (raycasting + visible hand + sculpt wiring)**

```js
// src/input/GodHand.js
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
```

- [ ] **Step 6: Wire into main.js**

Add import:

```js
import { GodHand } from './input/GodHand.js';
```

After `terrain` is created and added to the scene:

```js
const godHand = new GodHand({ camera, domElement: renderer.domElement, terrain, scene });
```

- [ ] **Step 7: Manual verification**

Run `npm run dev`. Expected: a glowing sphere ("god hand") follows the cursor across the terrain surface. Left-click-drag raises the land under the cursor in real time; shift+left-click-drag (or right-click-drag) lowers it. No console errors.

- [ ] **Step 8: Commit**

```bash
git add src/input/sculptInput.js src/input/sculptInput.test.js src/input/GodHand.js src/main.js
git commit -m "feat: add god-hand raycasting and terrain sculpting input"
git push
```

---

### Task 6: Follower state-machine and movement logic (pure, TDD)

**Files:**
- Create: `src/followers/followerLogic.js`
- Test: `src/followers/followerLogic.test.js`

**Interfaces:**
- Produces:
  - `FOLLOWER_STATES` = `{ WANDER: 'wander', WORSHIP: 'worship' }`.
  - `nextFollowerState({ currentState, distanceToShrine, worshipRadius }) -> string`.
  - `stepTowards(position, target, speed, dt) -> { x, z }`.
  - `pickWanderTarget(rng, bounds) -> { x, z }`.
  - Consumed by `FollowerSystem` in Task 7.

- [ ] **Step 1: Write the failing tests**

```js
// src/followers/followerLogic.test.js
import { describe, it, expect } from 'vitest';
import { FOLLOWER_STATES, nextFollowerState, stepTowards, pickWanderTarget } from './followerLogic.js';

describe('nextFollowerState', () => {
  it('transitions to worship when within the worship radius', () => {
    const state = nextFollowerState({ currentState: FOLLOWER_STATES.WANDER, distanceToShrine: 2, worshipRadius: 5 });
    expect(state).toBe(FOLLOWER_STATES.WORSHIP);
  });

  it('returns to wander when outside the worship radius', () => {
    const state = nextFollowerState({ currentState: FOLLOWER_STATES.WORSHIP, distanceToShrine: 10, worshipRadius: 5 });
    expect(state).toBe(FOLLOWER_STATES.WANDER);
  });
});

describe('stepTowards', () => {
  it('moves position toward the target by speed * dt', () => {
    const result = stepTowards({ x: 0, z: 0 }, { x: 10, z: 0 }, 2, 1);
    expect(result.x).toBeCloseTo(2);
    expect(result.z).toBeCloseTo(0);
  });

  it('does not overshoot the target', () => {
    const result = stepTowards({ x: 0, z: 0 }, { x: 1, z: 0 }, 10, 1);
    expect(result.x).toBeCloseTo(1);
  });

  it('returns the same position when already at the target', () => {
    const result = stepTowards({ x: 5, z: 5 }, { x: 5, z: 5 }, 2, 1);
    expect(result.x).toBeCloseTo(5);
    expect(result.z).toBeCloseTo(5);
  });
});

describe('pickWanderTarget', () => {
  it('returns the positive bound for rng() === 1', () => {
    const rng = () => 1;
    const target = pickWanderTarget(rng, 10);
    expect(target.x).toBeCloseTo(10);
    expect(target.z).toBeCloseTo(10);
  });

  it('returns the negative bound for rng() === 0', () => {
    const rng = () => 0;
    const target = pickWanderTarget(rng, 10);
    expect(target.x).toBeCloseTo(-10);
    expect(target.z).toBeCloseTo(-10);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/followers/followerLogic.test.js
```

Expected: FAIL — module does not exist.

- [ ] **Step 3: Write the implementation**

```js
// src/followers/followerLogic.js
export const FOLLOWER_STATES = Object.freeze({
  WANDER: 'wander',
  WORSHIP: 'worship',
});

export function nextFollowerState({ currentState, distanceToShrine, worshipRadius }) {
  if (distanceToShrine <= worshipRadius) return FOLLOWER_STATES.WORSHIP;
  return FOLLOWER_STATES.WANDER;
}

export function stepTowards(position, target, speed, dt) {
  const dx = target.x - position.x;
  const dz = target.z - position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist < 1e-4) return { x: position.x, z: position.z };
  const step = Math.min(speed * dt, dist);
  return {
    x: position.x + (dx / dist) * step,
    z: position.z + (dz / dist) * step,
  };
}

export function pickWanderTarget(rng, bounds) {
  return {
    x: (rng() * 2 - 1) * bounds,
    z: (rng() * 2 - 1) * bounds,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/followers/followerLogic.test.js
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/followers/followerLogic.js src/followers/followerLogic.test.js
git commit -m "feat: add follower state machine and movement logic"
git push
```

---

### Task 7: FollowerSystem — InstancedMesh crowd rendering

**Files:**
- Create: `src/followers/FollowerSystem.js`
- Modify: `src/main.js`

**Interfaces:**
- Consumes: `FOLLOWER_STATES`, `nextFollowerState`, `stepTowards`, `pickWanderTarget` from Task 6; `TerrainSystem.getHeightAt` from Task 3.
- Produces: class `FollowerSystem` with `.update(dt)`, `.getWorshipperCount() -> number`, `.getPopulation() -> number`. Consumed by `main.js` (Task 10) and `MiracleSystem` is independent of it (no direct coupling).

- [ ] **Step 1: Write the implementation**

(No dedicated unit test — this class binds pure logic from Task 6, already tested, to `THREE.InstancedMesh`; correctness is verified visually in Step 3.)

```js
// src/followers/FollowerSystem.js
import * as THREE from 'three';
import { FOLLOWER_STATES, nextFollowerState, stepTowards, pickWanderTarget } from './followerLogic.js';

const WANDER_SPEED = 1.5;
const WORSHIP_RADIUS = 6;
const WANDER_BOUNDS = 18;

export class FollowerSystem {
  constructor({ scene, terrain, count = 18, shrinePosition = { x: 0, z: 0 } }) {
    this.terrain = terrain;
    this.shrinePosition = shrinePosition;
    this.rng = Math.random;

    this.followers = Array.from({ length: count }, () => ({
      position: pickWanderTarget(this.rng, WANDER_BOUNDS),
      target: pickWanderTarget(this.rng, WANDER_BOUNDS),
      state: FOLLOWER_STATES.WANDER,
    }));

    const geometry = new THREE.ConeGeometry(0.4, 1.2, 6);
    const material = new THREE.MeshStandardMaterial({ color: 0xf2e6d8 });
    this.instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    scene.add(this.instancedMesh);

    this._matrix = new THREE.Matrix4();
    this._syncInstances();
  }

  update(dt) {
    for (const follower of this.followers) {
      const dx = follower.position.x - this.shrinePosition.x;
      const dz = follower.position.z - this.shrinePosition.z;
      const distanceToShrine = Math.sqrt(dx * dx + dz * dz);

      follower.state = nextFollowerState({
        currentState: follower.state,
        distanceToShrine,
        worshipRadius: WORSHIP_RADIUS,
      });

      if (follower.state === FOLLOWER_STATES.WANDER) {
        follower.position = stepTowards(follower.position, follower.target, WANDER_SPEED, dt);
        const dxT = follower.target.x - follower.position.x;
        const dzT = follower.target.z - follower.position.z;
        if (Math.sqrt(dxT * dxT + dzT * dzT) < 0.5) {
          follower.target = pickWanderTarget(this.rng, WANDER_BOUNDS);
        }
      }
    }
    this._syncInstances();
  }

  _syncInstances() {
    this.followers.forEach((follower, i) => {
      const y = this.terrain.getHeightAt(follower.position.x, follower.position.z);
      this._matrix.makeTranslation(follower.position.x, y + 0.6, follower.position.z);
      this.instancedMesh.setMatrixAt(i, this._matrix);
    });
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  getWorshipperCount() {
    return this.followers.filter((f) => f.state === FOLLOWER_STATES.WORSHIP).length;
  }

  getPopulation() {
    return this.followers.length;
  }
}
```

- [ ] **Step 2: Wire into main.js with a shrine marker**

Add import:

```js
import { FollowerSystem } from './followers/FollowerSystem.js';
```

After `terrain` is added to the scene:

```js
const shrineGeometry = new THREE.CylinderGeometry(1.2, 1.5, 2, 8);
const shrineMaterial = new THREE.MeshStandardMaterial({ color: 0xd9c48f });
const shrineMesh = new THREE.Mesh(shrineGeometry, shrineMaterial);
shrineMesh.position.set(0, terrain.getHeightAt(0, 0) + 1, 0);
scene.add(shrineMesh);

const followerSystem = new FollowerSystem({ scene, terrain, count: 18, shrinePosition: { x: 0, z: 0 } });
```

Inside `animate()`, before `renderer.render(...)`:

```js
followerSystem.update(dt);
```

This requires `dt` — add a `THREE.Clock` above `animate`:

```js
const clock = new THREE.Clock();
```

And at the top of `animate()`:

```js
const dt = Math.min(clock.getDelta(), 0.1);
```

- [ ] **Step 3: Manual verification**

Run `npm run dev`. Expected: ~18 cone-shaped followers wander across the terrain surface (correctly following its bumps), and cluster/stop near the shrine cylinder at the origin when close enough. No console errors.

- [ ] **Step 4: Commit**

```bash
git add src/followers/FollowerSystem.js src/main.js
git commit -m "feat: add FollowerSystem with InstancedMesh crowd and shrine"
git push
```

---

### Task 8: FaithSystem and HUD

**Files:**
- Create: `src/faith/FaithSystem.js`
- Test: `src/faith/FaithSystem.test.js`
- Create: `src/ui/HUD.js`
- Modify: `index.html` (HUD styling)
- Modify: `src/main.js`

**Interfaces:**
- Produces:
  - `FaithSystem`: `.faith` (number), `.addFaith(amount) -> number`, `.tick(worshipperCount, dt, faithPerWorshipperPerSecond = 0.5) -> number`.
  - `formatFaith(value) -> string`.
  - `HUD` class: `.update({ faith, population, worshippers })`.
- Consumes: `FollowerSystem.getWorshipperCount()` / `.getPopulation()` from Task 7, wired in `main.js`.

- [ ] **Step 1: Write the failing tests**

```js
// src/faith/FaithSystem.test.js
import { describe, it, expect } from 'vitest';
import { FaithSystem, formatFaith } from './FaithSystem.js';

describe('FaithSystem', () => {
  it('starts at zero faith', () => {
    expect(new FaithSystem().faith).toBe(0);
  });

  it('adds faith and returns the new total', () => {
    const faith = new FaithSystem();
    expect(faith.addFaith(10)).toBe(10);
    expect(faith.addFaith(5)).toBe(15);
  });

  it('never drops below zero', () => {
    const faith = new FaithSystem();
    faith.addFaith(3);
    faith.addFaith(-100);
    expect(faith.faith).toBe(0);
  });

  it('accrues faith from worshippers over time on tick', () => {
    const faith = new FaithSystem();
    faith.tick(4, 2, 0.5); // 4 worshippers * 2s * 0.5/s = 4
    expect(faith.faith).toBeCloseTo(4);
  });
});

describe('formatFaith', () => {
  it('floors and formats the value', () => {
    expect(formatFaith(1234.9)).toBe('1.234');
  });

  it('formats zero', () => {
    expect(formatFaith(0)).toBe('0');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/faith/FaithSystem.test.js
```

Expected: FAIL — module does not exist.

- [ ] **Step 3: Write the implementation**

```js
// src/faith/FaithSystem.js
export class FaithSystem {
  constructor() {
    this.faith = 0;
  }

  addFaith(amount) {
    this.faith = Math.max(0, this.faith + amount);
    return this.faith;
  }

  tick(worshipperCount, dt, faithPerWorshipperPerSecond = 0.5) {
    return this.addFaith(worshipperCount * faithPerWorshipperPerSecond * dt);
  }
}

export function formatFaith(value) {
  return Math.floor(value).toLocaleString('tr-TR');
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/faith/FaithSystem.test.js
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Write HUD and its styling**

```js
// src/ui/HUD.js
import { formatFaith } from '../faith/FaithSystem.js';

export class HUD {
  constructor(container) {
    this.container = container;
    this.container.innerHTML = `
      <div class="hud-stat" data-role="faith"></div>
      <div class="hud-stat" data-role="population"></div>
    `;
    this.faithEl = this.container.querySelector('[data-role="faith"]');
    this.populationEl = this.container.querySelector('[data-role="population"]');
  }

  update({ faith, population, worshippers }) {
    this.faithEl.textContent = `İnanç: ${formatFaith(faith)}`;
    this.populationEl.textContent = `Nüfus: ${population} (${worshippers} ibadet ediyor)`;
  }
}
```

Update the `<style>` block in `index.html` to add:

```css
#hud {
  position: fixed;
  top: 16px;
  left: 16px;
  color: #fff8e7;
  font-family: Georgia, serif;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  font-size: 18px;
  pointer-events: none;
  z-index: 10;
}
.hud-stat {
  margin-bottom: 4px;
}
```

- [ ] **Step 6: Wire into main.js**

Add import:

```js
import { FaithSystem } from './faith/FaithSystem.js';
import { HUD } from './ui/HUD.js';
```

After `followerSystem` is created:

```js
const faithSystem = new FaithSystem();
const hud = new HUD(document.getElementById('hud'));
```

Inside `animate()`, after `followerSystem.update(dt)`:

```js
const worshippers = followerSystem.getWorshipperCount();
faithSystem.tick(worshippers, dt);

hud.update({
  faith: faithSystem.faith,
  population: followerSystem.getPopulation(),
  worshippers,
});
```

- [ ] **Step 7: Manual verification**

Run `npm run dev`. Expected: top-left HUD shows "İnanç: 0" and "Nüfus: 18 (0 ibadet ediyor)", and the faith number climbs as followers cluster near the shrine and their worshipper count rises. No console errors.

- [ ] **Step 8: Commit**

```bash
git add src/faith/FaithSystem.js src/faith/FaithSystem.test.js src/ui/HUD.js index.html src/main.js
git commit -m "feat: add FaithSystem and HUD faith/population display"
git push
```

---

### Task 9: Rain miracle logic and VFX

**Files:**
- Create: `src/miracles/miracleLogic.js`
- Test: `src/miracles/miracleLogic.test.js`
- Create: `src/miracles/MiracleSystem.js`

**Interfaces:**
- Produces:
  - `isWithinRadius(pointA, pointB, radius) -> boolean`.
  - Constants `RAIN_DURATION_SECONDS`, `RAIN_RADIUS`, `RAIN_FAITH_MULTIPLIER`.
  - `MiracleSystem` class: `.castRainAt({ x, z })`, `.update(dt)`, `.getFaithMultiplierAt(point) -> number`. Wired into `main.js` in Task 10 (not consumed by `FaithSystem`/`FollowerSystem` yet in the MVP — the multiplier hook exists for a future task to apply it, and is exercised manually via the VFX in this task).

- [ ] **Step 1: Write the failing tests**

```js
// src/miracles/miracleLogic.test.js
import { describe, it, expect } from 'vitest';
import { isWithinRadius } from './miracleLogic.js';

describe('isWithinRadius', () => {
  it('returns true when points are exactly at the radius boundary', () => {
    expect(isWithinRadius({ x: 0, z: 0 }, { x: 5, z: 0 }, 5)).toBe(true);
  });

  it('returns true for points inside the radius', () => {
    expect(isWithinRadius({ x: 0, z: 0 }, { x: 1, z: 1 }, 5)).toBe(true);
  });

  it('returns false for points outside the radius', () => {
    expect(isWithinRadius({ x: 0, z: 0 }, { x: 10, z: 0 }, 5)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/miracles/miracleLogic.test.js
```

Expected: FAIL — module does not exist.

- [ ] **Step 3: Write miracleLogic.js**

```js
// src/miracles/miracleLogic.js
export function isWithinRadius(pointA, pointB, radius) {
  const dx = pointA.x - pointB.x;
  const dz = pointA.z - pointB.z;
  return Math.sqrt(dx * dx + dz * dz) <= radius;
}

export const RAIN_DURATION_SECONDS = 8;
export const RAIN_RADIUS = 10;
export const RAIN_FAITH_MULTIPLIER = 2;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/miracles/miracleLogic.test.js
```

Expected: all 3 tests PASS.

- [ ] **Step 5: Write MiracleSystem (rain VFX + timer)**

```js
// src/miracles/MiracleSystem.js
import * as THREE from 'three';
import { isWithinRadius, RAIN_DURATION_SECONDS, RAIN_RADIUS, RAIN_FAITH_MULTIPLIER } from './miracleLogic.js';

export class MiracleSystem {
  constructor({ scene }) {
    this.activeRain = null; // { center: {x, z}, remaining: number }
    this.particleCount = 300;

    const positions = new Float32Array(this.particleCount * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0x9fd8ff, size: 0.15, transparent: true, opacity: 0.8 });
    this.rainParticles = new THREE.Points(geometry, material);
    this.rainParticles.visible = false;
    scene.add(this.rainParticles);
  }

  castRainAt(point) {
    this.activeRain = { center: { x: point.x, z: point.z }, remaining: RAIN_DURATION_SECONDS };
    this.rainParticles.visible = true;
    this.rainParticles.position.set(point.x, 8, point.z);

    const positions = this.rainParticles.geometry.attributes.position;
    for (let i = 0; i < this.particleCount; i++) {
      positions.setXYZ(
        i,
        (Math.random() * 2 - 1) * RAIN_RADIUS,
        Math.random() * 6,
        (Math.random() * 2 - 1) * RAIN_RADIUS
      );
    }
    positions.needsUpdate = true;
  }

  update(dt) {
    if (!this.activeRain) return;

    this.activeRain.remaining -= dt;
    if (this.activeRain.remaining <= 0) {
      this.activeRain = null;
      this.rainParticles.visible = false;
      return;
    }

    const positions = this.rainParticles.geometry.attributes.position;
    for (let i = 0; i < this.particleCount; i++) {
      let y = positions.getY(i) - dt * 4;
      if (y < 0) y = 6;
      positions.setY(i, y);
    }
    positions.needsUpdate = true;
  }

  getFaithMultiplierAt(point) {
    if (!this.activeRain) return 1;
    return isWithinRadius(point, this.activeRain.center, RAIN_RADIUS) ? RAIN_FAITH_MULTIPLIER : 1;
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/miracles/miracleLogic.js src/miracles/miracleLogic.test.js src/miracles/MiracleSystem.js
git commit -m "feat: add rain miracle logic and particle VFX system"
git push
```

(MiracleSystem is wired into `main.js` and manually verified in Task 10, alongside the rest of the integration.)

---

### Task 10: Full integration, Playwright smoke test, README

**Files:**
- Modify: `src/main.js` (final wiring: rain-cast key binding, lighting/fog polish)
- Create: `playwright.config.js`
- Create: `e2e/smoke.spec.js`
- Create: `README.md`

**Interfaces:**
- Consumes: every class/function produced in Tasks 1–9.
- Produces: the finished MVP entry point (`src/main.js`) and an automated smoke test that guards it going forward.

- [ ] **Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Rewrite src/main.js as the final integration**

```js
// src/main.js
import * as THREE from 'three';
import { TerrainSystem } from './terrain/TerrainSystem.js';
import { CameraRig } from './camera/CameraRig.js';
import { GodHand } from './input/GodHand.js';
import { FollowerSystem } from './followers/FollowerSystem.js';
import { FaithSystem } from './faith/FaithSystem.js';
import { MiracleSystem } from './miracles/MiracleSystem.js';
import { HUD } from './ui/HUD.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 40, 90);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 28, 28);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff2cc, 1.1);
sunLight.position.set(20, 30, 10);
scene.add(sunLight);

const terrain = new TerrainSystem({ seed: 5 });
scene.add(terrain.mesh);

const shrineGeometry = new THREE.CylinderGeometry(1.2, 1.5, 2, 8);
const shrineMaterial = new THREE.MeshStandardMaterial({ color: 0xd9c48f });
const shrineMesh = new THREE.Mesh(shrineGeometry, shrineMaterial);
shrineMesh.position.set(0, terrain.getHeightAt(0, 0) + 1, 0);
scene.add(shrineMesh);

const cameraRig = new CameraRig(camera, renderer.domElement);
const godHand = new GodHand({ camera, domElement: renderer.domElement, terrain, scene });
const followerSystem = new FollowerSystem({ scene, terrain, count: 18, shrinePosition: { x: 0, z: 0 } });
const faithSystem = new FaithSystem();
const miracleSystem = new MiracleSystem({ scene });
const hud = new HUD(document.getElementById('hud'));

let rainArmed = false;
window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'r') {
    rainArmed = true;
    godHand.sculptingEnabled = false;
  }
});
renderer.domElement.addEventListener('pointerdown', (event) => {
  if (rainArmed && event.button === 0) {
    if (godHand.handMesh.visible) {
      miracleSystem.castRainAt(godHand.handMesh.position.clone());
    }
    rainArmed = false;
    godHand.sculptingEnabled = true;
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  cameraRig.update();
  followerSystem.update(dt);
  miracleSystem.update(dt);

  const worshippers = followerSystem.getWorshipperCount();
  faithSystem.tick(worshippers, dt);

  hud.update({
    faith: faithSystem.faith,
    population: followerSystem.getPopulation(),
    worshippers,
  });

  renderer.render(scene, camera);
}
animate();
```

- [ ] **Step 3: Write playwright.config.js**

```js
// playwright.config.js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'npm run dev -- --port 5183',
    port: 5183,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:5183',
  },
});
```

- [ ] **Step 4: Write e2e/smoke.spec.js**

```js
// e2e/smoke.spec.js
import { test, expect } from '@playwright/test';

test('loads the game without console errors and renders a canvas', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('/');
  await page.waitForSelector('canvas');

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  expect(box.width).toBeGreaterThan(0);
  expect(box.height).toBeGreaterThan(0);

  expect(errors).toEqual([]);
});

test('shows the HUD with faith and population text', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500);
  const hudText = await page.locator('#hud').innerText();
  expect(hudText).toContain('İnanç');
  expect(hudText).toContain('Nüfus');
});
```

Add to `package.json` `"scripts"`:

```json
"test:e2e": "playwright test"
```

- [ ] **Step 5: Run the smoke test**

```bash
npx playwright test
```

Expected: both tests PASS.

- [ ] **Step 6: Run the full unit test suite**

```bash
npm test
```

Expected: all unit tests from Tasks 2, 3, 5, 6, 8, 9 PASS (no regressions).

- [ ] **Step 7: Write README.md**

```markdown
# God Game (MVP)

Godus / Populous / Black & White'tan ilham alan, tarayıcıda çalışan bir top-down god-game prototipi. Three.js ile yazıldı.

## Çalıştırma

\`\`\`bash
npm install
npm run dev
\`\`\`

Tarayıcıda `http://localhost:5173` adresini aç.

## Kontroller

- **Sol tık + sürükle:** Sahnede döndür (kamera).
- **Sağ tık + sürükle:** Kaydır (pan).
- **Fare tekerleği:** Yakınlaş / uzaklaş.
- **Sol tık (arazi üzerinde) + sürükle:** Araziyi yükselt.
- **Shift + sol tık + sürükle:** Araziyi alçalt.
- **R tuşu, ardından tıkla:** Tanrı elinin bulunduğu noktaya yağmur mucizesi çağır.

## Test

\`\`\`bash
npm test        # birim testleri (Vitest)
npm run test:e2e  # duman testi (Playwright)
\`\`\`

## Kapsam

Bu bir MVP'dir. Kapsam ve sonraki adımlar için bkz. `docs/superpowers/specs/2026-07-27-god-game-design.md`.
```

- [ ] **Step 8: Manual end-to-end browser verification**

Run `npm run dev`, open the browser, and confirm the full loop: orbit/pan/zoom the camera, sculpt terrain up and down, watch followers wander and cluster near the shrine, press `R` then click to cast rain and see falling particles, and watch the HUD's faith count climb as worshippers gather. No console errors.

- [ ] **Step 9: Commit**

```bash
git add src/main.js playwright.config.js e2e/smoke.spec.js package.json README.md
git commit -m "feat: integrate all MVP systems, add Playwright smoke test and README"
git push
```
