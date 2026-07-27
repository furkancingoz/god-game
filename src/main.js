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
