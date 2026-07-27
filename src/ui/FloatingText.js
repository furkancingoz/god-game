import * as THREE from 'three';

export class FloatingTextManager {
  constructor({ scene, camera }) {
    this.scene = scene;
    this.camera = camera;
    this.container = document.createElement('div');
    this.container.id = 'floating-text-container';
    this.container.style.position = 'fixed';
    this.container.style.inset = '0';
    this.container.style.pointerEvents = 'none';
    this.container.style.zIndex = '150';
    document.body.appendChild(this.container);

    this.floatingTexts = [];
  }

  spawnText(worldPoint, text, color = '#ffd700') {
    const el = document.createElement('div');
    el.className = 'floating-popup';
    el.textContent = text;
    el.style.position = 'absolute';
    el.style.color = color;
    el.style.fontFamily = 'Cinzel, Georgia, serif';
    el.style.fontSize = '18px';
    el.style.fontWeight = '800';
    el.style.textShadow = '0 2px 6px rgba(0, 0, 0, 0.8), 0 0 12px ' + color;
    el.style.transition = 'transform 0.8s ease-out, opacity 0.8s ease-out';
    el.style.transform = 'translate(-50%, -50%) translateY(0px)';
    el.style.opacity = '1';

    this.container.appendChild(el);

    this.floatingTexts.push({
      element: el,
      worldPos: worldPoint.clone(),
      life: 0.9,
    });
  }

  update(dt) {
    const vector = new THREE.Vector3();

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const item = this.floatingTexts[i];
      item.life -= dt;

      if (item.life <= 0) {
        item.element.remove();
        this.floatingTexts.splice(i, 1);
        continue;
      }

      // Convert 3D world pos to 2D screen pos
      vector.copy(item.worldPos);
      vector.project(this.camera);

      const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;

      const offset = (0.9 - item.life) * 40; // float upwards
      item.element.style.left = `${x}px`;
      item.element.style.top = `${y - offset}px`;
      item.element.style.opacity = `${item.life / 0.9}`;
    }
  }
}
