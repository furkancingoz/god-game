import * as THREE from 'three';
import { TerrainSystem } from './terrain/TerrainSystem.js';
import { CameraRig } from './camera/CameraRig.js';
import { GodHand } from './input/GodHand.js';
import { FollowerSystem } from './followers/FollowerSystem.js';
import { FaithSystem } from './faith/FaithSystem.js';
import { MiracleSystem } from './miracles/MiracleSystem.js';
import { ShoreWater } from './environment/WaterShader.js';
import { DivineAltarSystem, StylizedTreeSystem } from './environment/StylizedModels.js';
import { StylizedBuildingSystem } from './buildings/StylizedBuildingSystem.js';
import { ResourceSystem } from './economy/ResourceSystem.js';
import { FarmSystem } from './environment/FarmSystem.js';
import { WeatherSystem } from './weather/WeatherSystem.js';
import { PostProcessingPipeline } from './graphics/PostProcessing.js';
import { FloatingTextManager } from './ui/FloatingText.js';
import { soundEngine } from './audio/SoundEngine.js';
import { HUD } from './ui/HUD.js';
import { FollowerInspector } from './ui/FollowerInspector.js';
import { SpellbookModal } from './ui/SpellbookModal.js';

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
renderer.toneMappingExposure = 1.08;
document.body.appendChild(renderer.domElement);

// Setup Post-Processing (Bloom + Color Grading)
const postProcessing = new PostProcessingPipeline({ renderer, scene, camera });
const floatingTextManager = new FloatingTextManager({ scene, camera });

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

// Initialize Weather & Economy
const weatherSystem = new WeatherSystem({ scene, sunLight, hemiLight });
const resourceSystem = new ResourceSystem();

// Initialize Terrain & Environment
const terrain = new TerrainSystem({ seed: 7 });
scene.add(terrain.mesh);

const water = new ShoreWater({ scene, worldSize: 50 });
const treeSystem = new StylizedTreeSystem({ scene, terrain, treeCount: 80 });
const farmSystem = new FarmSystem({ scene, terrain });
const buildingSystem = new StylizedBuildingSystem({ scene, terrain });

// Divine Altar with floating rotating crystal
const altarSystem = new DivineAltarSystem({ scene, terrain });

const cameraRig = new CameraRig(camera, renderer.domElement);
const godHand = new GodHand({ camera, domElement: renderer.domElement, terrain, scene });
const followerSystem = new FollowerSystem({ scene, terrain, count: 24, shrinePosition: { x: 0, z: 0 } });
const faithSystem = new FaithSystem();
const miracleSystem = new MiracleSystem({ scene, terrain, buildingSystem, farmSystem });

// Setup Modals & HUD
const followerInspector = new FollowerInspector(document.body, (follower) => {
  followerSystem.makeProphet(follower);
  soundEngine.playMiracleChime();
  hud.showNotification(`${follower.name} köylüsü senin ilahi PEYGAMBERİN ilan edildi! ✨`);
});

const spellbookModal = new SpellbookModal(document.body);

let timeScale = 1.0;

const hud = new HUD(
  document.getElementById('hud'),
  (power) => {
    godHand.setPower(power);
    soundEngine.playButtonClick();
    const powerNames = {
      sculpt: 'Şekillendirme Modu: Sol tık yükseltir, Shift+tık alçaltır.',
      rain: 'Bereket Yağmuru: Toprağı sular ve tarlalarda ekin yetiştirir.',
      sun: 'Kutsal Güneş: İbadet hızını artırır.',
      fire: 'İlahi Ateş: Yakıcı ateş indirir, inancı katlar.',
      bless: 'Köy Kutsaması: Düz arazide yeni bir yerleşim yeri oluşturur.',
      meteor: 'Göktaşı Çarpması: Yıkıcı bir göktaşı indirir.',
    };
    hud.showNotification(powerNames[power]);
  },
  () => {
    soundEngine.playButtonClick();
    spellbookModal.show();
  },
  (speed) => {
    soundEngine.playButtonClick();
    timeScale = speed;
    weatherSystem.isPaused = speed === 0;
    weatherSystem.timeScale = speed;
  }
);

// Raycasting for Follower Click Selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener('click', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(followerSystem.followerMeshes, true);

  if (intersects.length > 0) {
    let obj = intersects[0].object;
    while (obj && !obj.userData.followerIndex && obj.userData.followerIndex !== 0 && obj.parent) {
      obj = obj.parent;
    }
    if (obj && (obj.userData.followerIndex || obj.userData.followerIndex === 0)) {
      const idx = obj.userData.followerIndex;
      const follower = followerSystem.followers[idx];
      followerInspector.inspect(follower);
      soundEngine.playButtonClick();
      return;
    }
  }
});

// Pointer click handler for miracles
renderer.domElement.addEventListener('pointerdown', (event) => {
  soundEngine._ensureContext();
  if (event.button !== 0) return;
  if (!godHand.handMesh.visible) return;

  const targetPoint = godHand.handMesh.position.clone();
  targetPoint.y -= 1.2;

  if (godHand.activePower === 'sculpt') {
    soundEngine.playSculptRumble();
  } else if (godHand.activePower === 'rain') {
    miracleSystem.castRainAt(targetPoint);
    faithSystem.addFaith(10);
    resourceSystem.addFood(15);
    floatingTextManager.spawnText(targetPoint, '+10 İnanç ✨', '#ffd700');
    hud.showNotification("Bereket Yağmuru indirildi! Toprak canlanıyor.");
  } else if (godHand.activePower === 'sun') {
    miracleSystem.castSunbeamAt(targetPoint);
    faithSystem.addFaith(15);
    floatingTextManager.spawnText(targetPoint, '+15 İnanç ✨', '#ffd700');
    hud.showNotification("Kutsal Güneş ışını indirildi!");
  } else if (godHand.activePower === 'fire') {
    miracleSystem.castFireAt(targetPoint);
    faithSystem.addFaith(25);
    floatingTextManager.spawnText(targetPoint, '+25 İnanç 🔥', '#ff4500');
    hud.showNotification("İlahi Ateş gazabı indirildi!");
  } else if (godHand.activePower === 'meteor') {
    miracleSystem.castMeteorAt(targetPoint);
    faithSystem.addFaith(40);
    floatingTextManager.spawnText(targetPoint, '+40 İnanç ☄️', '#ff3300');
    hud.showNotification("Gökyüzünden devasa bir göktaşı indirildi!");
  } else if (godHand.activePower === 'bless') {
    if (resourceSystem.canAfford({ wood: 10 })) {
      const hut = buildingSystem.buildHutAt(targetPoint.x, targetPoint.z);
      if (hut) {
        resourceSystem.consume({ wood: 10 });
        faithSystem.addFaith(30);
        farmSystem.createFarmPlot(targetPoint.x + 2, targetPoint.z + 2);
        floatingTextManager.spawnText(targetPoint, '+30 İnanç 🏠', '#38b6ff');
        hud.showNotification("Köylüler yeni bir kulübe ve buğday tarlası kurdu!");
      } else {
        hud.showNotification("Kulübe için karada ve uygun bir alan seçmelisin.");
      }
    } else {
      hud.showNotification("Yetersiz odun! Kulübe için 10 odun gerekli.");
    }
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  postProcessing.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const rawDt = clock.getDelta();
  const dt = Math.min(rawDt, 0.1) * timeScale;
  const time = clock.getElapsedTime();

  cameraRig.update();

  // Screen shake
  if (miracleSystem.screenShakeIntensity > 0) {
    const shake = miracleSystem.screenShakeIntensity;
    camera.position.x += (Math.random() * 2 - 1) * shake;
    camera.position.y += (Math.random() * 2 - 1) * shake;
  }

  if (timeScale > 0) {
    weatherSystem.update(dt);
    water.update(time);
    treeSystem.update(time);
    altarSystem.update(time);
    farmSystem.update(dt);
    buildingSystem.update(dt);
    followerSystem.update(dt);
    miracleSystem.update(dt);
    floatingTextManager.update(dt);

    resourceSystem.addWood(dt * 0.1);
    resourceSystem.addFood(dt * 0.15);

    const worshippers = followerSystem.getWorshipperCount();
    faithSystem.tick(worshippers, dt);
  }

  hud.update({
    faith: faithSystem.faith,
    population: followerSystem.getPopulation(),
    worshippers: followerSystem.getWorshipperCount(),
    resources: {
      wood: resourceSystem.wood,
      food: resourceSystem.food,
      stone: resourceSystem.stone,
    },
    timeString: weatherSystem.getTimeFormatted(),
  });

  // Render via EffectComposer Post-Processing Pipeline (Bloom + Glow)
  postProcessing.render();
}
animate();
