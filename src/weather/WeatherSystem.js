import * as THREE from 'three';

export class WeatherSystem {
  constructor({ scene, sunLight, hemiLight }) {
    this.scene = scene;
    this.sunLight = sunLight;
    this.hemiLight = hemiLight;
    this.dayTime = 0.25; // 0.0 to 1.0 (0.25 = noon, 0.5 = sunset, 0.75 = midnight, 0.0 = sunrise)
    this.dayDuration = 180; // 180 seconds per full 24h cycle
    this.isPaused = false;
    this.timeScale = 1.0;

    // Create Starfield for Night
    const starCount = 300;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() * 2 - 1) * 200;
      starPos[i * 3 + 1] = Math.random() * 80 + 30; // High in sky
      starPos[i * 3 + 2] = (Math.random() * 2 - 1) * 200;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true, opacity: 0 });
    this.starMesh = new THREE.Points(starGeo, starMat);
    scene.add(this.starMesh);
  }

  update(dt) {
    if (this.isPaused) return;

    this.dayTime = (this.dayTime + (dt * this.timeScale) / this.dayDuration) % 1.0;

    // Angle of sun in sky (0 to 2*PI)
    const angle = this.dayTime * Math.PI * 2;
    const radius = 60;
    const sunX = Math.cos(angle) * radius;
    const sunY = Math.sin(angle) * radius;
    const sunZ = 20;

    this.sunLight.position.set(sunX, Math.max(-10, sunY), sunZ);

    // Sky colors based on time of day
    let skyColor, sunColor, sunIntensity, starOpacity;

    if (this.dayTime >= 0.2 && this.dayTime < 0.45) {
      // Day (Noon)
      skyColor = new THREE.Color(0x7ac1ec);
      sunColor = new THREE.Color(0xfff5db);
      sunIntensity = 1.3;
      starOpacity = 0;
    } else if (this.dayTime >= 0.45 && this.dayTime < 0.55) {
      // Sunset
      const t = (this.dayTime - 0.45) / 0.1;
      skyColor = new THREE.Color(0x7ac1ec).lerp(new THREE.Color(0xcc5836), t);
      sunColor = new THREE.Color(0xff7733);
      sunIntensity = 1.3 - t * 0.8;
      starOpacity = t * 0.5;
    } else if (this.dayTime >= 0.55 && this.dayTime < 0.95) {
      // Night
      skyColor = new THREE.Color(0x090d16);
      sunColor = new THREE.Color(0x4a6fa5); // Soft moonlight
      sunIntensity = 0.35;
      starOpacity = 0.9;
    } else {
      // Sunrise
      const t = this.dayTime >= 0.95 ? (this.dayTime - 0.95) / 0.25 : (this.dayTime + 0.05) / 0.25;
      skyColor = new THREE.Color(0x090d16).lerp(new THREE.Color(0x7ac1ec), t);
      sunColor = new THREE.Color(0xffd180);
      sunIntensity = 0.35 + t * 0.95;
      starOpacity = 0.9 * (1 - t);
    }

    this.scene.background = skyColor;
    if (this.scene.fog) this.scene.fog.color = skyColor;
    this.sunLight.color = sunColor;
    this.sunLight.intensity = sunIntensity;
    this.starMesh.material.opacity = starOpacity;
  }

  getTimeFormatted() {
    const hours = Math.floor(this.dayTime * 24);
    const minutes = Math.floor((this.dayTime * 24 % 1) * 60);
    const hh = hours < 10 ? `0${hours}` : `${hours}`;
    const mm = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hh}:${mm}`;
  }
}
