import * as THREE from 'three';
import { TerrainSystem } from './terrain/TerrainSystem.js';
import { CameraRig } from './camera/CameraRig.js';
import { GodHand } from './input/GodHand.js';
import { FollowerSystem } from './followers/FollowerSystem.js';
import { FaithSystem } from './faith/FaithSystem.js';
import { MiracleSystem } from './miracles/MiracleSystem.js';
import { OceanSystem } from './environment/OceanSystem.js';
import { EnvironmentSystem } from './environment/EnvironmentSystem.js';
import { BuildingSystem } from './buildings/BuildingSystem.js';
import { HUD } from './ui/HUD.js';

// Setup Scene & Atmosphere
const scene = new THREE.Scene();
const skyColor = new THREE.Color(0x7ac1ec);
scene.background = skyColor;
scene.fog = new THREE.FogExp2(0x7ac1ec, 0.008);

// Setup Camera
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 24, 30);

// Setup Renderer with Soft Shadows
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

// Setup Lighting System
const hemiLight = new THREE.HemisphereLight(0xb1e0ff, 0x544026, 0.7);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xfff5db, 1.3);
sunLight.position.set(30, 45, 20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 120;
const d = 40;
sunLight.shadow.camera.left = -d;
sunLight.shadow.camera.right = d;
sunLight.shadow.camera.top = d;
sunLight.shadow.camera.bottom = -d;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);

// Initialize Game Systems
const terrain = new TerrainSystem({ seed: 7 });
scene.add(terrain.mesh);

const ocean = new OceanSystem({ scene, worldSize: 50 });
const environment = new EnvironmentSystem({ scene, terrain, treeCount: 70, rockCount: 35 });
const buildingSystem = new BuildingSystem({ scene, terrain });

// Shrine at island center
const shrineGeometry = new THREE.CylinderGeometry(1.2, 1.6, 2.2, 8);
const shrineMaterial = new THREE.MeshStandardMaterial({ color: 0xe0c388, roughness: 0.3, metalness: 0.2, flatShading: true });
const shrineMesh = new THREE.Mesh(shrineGeometry, shrineMaterial);
shrineMesh.position.set(0, terrain.getHeightAt(0, 0) + 1.1, 0);
shrineMesh.castShadow = true;
shrineMesh.receiveShadow = true;
scene.add(shrineMesh);

const cameraRig = new CameraRig(camera, renderer.domElement);
const godHand = new GodHand({ camera, domElement: renderer.domElement, terrain, scene });
const followerSystem = new FollowerSystem({ scene, terrain, count: 24, shrinePosition: { x: 0, z: 0 } });
const faithSystem = new FaithSystem();
const miracleSystem = new MiracleSystem({ scene, terrain, buildingSystem });

let hud;

// Wire Divine Power Selector
hud = new HUD(document.getElementById('hud'), (power) => {
  godHand.setPower(power);
  const powerNames = {
    sculpt: 'Şekillendirme Modu: Sol tık yükseltir, Shift+tık alçaltır.',
    rain: 'Bereket Yağmuru: Tıkladığın yere bolluk getirir.',
    sun: 'Kutsal Güneş: İbadet hızını artırır ve ruhları iyileştirir.',
    fire: 'İlahi Ateş: Yakıcı ateş indirir, inancı katlar.',
    bless: 'Köy Kutsaması: Düz arazide yeni bir yerleşim yeri oluşturur.',
  };
  hud.showNotification(powerNames[power]);
});

// Pointer click handler for non-drag miracles
renderer.domElement.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return; // Only left click for miracles
  if (!godHand.handMesh.visible) return;

  const targetPoint = godHand.handMesh.position.clone();
  targetPoint.y -= 1.2; // Terrain surface point

  if (godHand.activePower === 'rain') {
    if (faithSystem.faith >= 15 || faithSystem.faith === 0) {
      miracleSystem.castRainAt(targetPoint);
      faithSystem.addFaith(10);
      hud.showNotification("Bereket Yağmuru indirildi! Toprak canlanıyor.");
    } else {
      hud.showNotification("Yetersiz İnanç! Yağmur için 15 inanç puanı gerekli.");
    }
  } else if (godHand.activePower === 'sun') {
    miracleSystem.castSunbeamAt(targetPoint);
    faithSystem.addFaith(15);
    hud.showNotification("Kutsal Güneş ışını indirildi!");
  } else if (godHand.activePower === 'fire') {
    miracleSystem.castFireAt(targetPoint);
    faithSystem.addFaith(25);
    hud.showNotification("İlahi Ateş gazabı indirildi!");
  } else if (godHand.activePower === 'bless') {
    const hut = buildingSystem.buildHutAt(targetPoint.x, targetPoint.z);
    if (hut) {
      faithSystem.addFaith(30);
      hud.showNotification("Köylüler senin adına yeni bir kulübe inşa etti!");
    } else {
      hud.showNotification("Kulübe için düz ve karada bir alan seçmelisin.");
    }
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
  const time = clock.getElapsedTime();

  cameraRig.update();
  ocean.update(time);
  environment.update(time);
  buildingSystem.update(dt);
  followerSystem.update(dt);
  miracleSystem.update(dt);

  // Shrine position update on terrain sculpt
  shrineMesh.position.y = terrain.getHeightAt(0, 0) + 1.1;

  const worshippers = followerSystem.getWorshipperCount();
  faithSystem.tick(worshippers, dt);

  hud.update({
    faith: faithSystem.faith,
    population: followerSystem.getPopulation(),
    worshippers,
    hutCount: buildingSystem.getHutCount(),
  });

  renderer.render(scene, camera);
}
animate();
