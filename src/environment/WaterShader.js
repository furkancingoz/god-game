import * as THREE from 'three';

export class ShoreWater {
  constructor({ scene, worldSize = 100 }) {
    this.geometry = new THREE.PlaneGeometry(worldSize * 2, worldSize * 2, 128, 128);
    this.geometry.rotateX(-Math.PI / 2);

    this.uniforms = {
      uTime: { value: 0 },
      uDeepColor: { value: new THREE.Color(0x0f4c81) },
      uShallowColor: { value: new THREE.Color(0x38b6ff) },
      uFoamColor: { value: new THREE.Color(0xffffff) },
    };

    const vertexShader = `
      uniform float uTime;
      varying vec3 vWorldPosition;
      varying vec2 vUv;
      varying float vWaveHeight;

      void main() {
        vUv = uv;
        vec3 pos = position;
        
        float wave1 = sin(pos.x * 0.15 + uTime * 1.5) * 0.15;
        float wave2 = cos(pos.z * 0.2 + uTime * 1.2) * 0.1;
        pos.y += wave1 + wave2;
        vWaveHeight = wave1 + wave2;

        vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `;

    const fragmentShader = `
      uniform vec3 uDeepColor;
      uniform vec3 uShallowColor;
      uniform vec3 uFoamColor;
      uniform float uTime;

      varying vec3 vWorldPosition;
      varying vec2 vUv;
      varying float vWaveHeight;

      void main() {
        float distFromCenter = length(vWorldPosition.xz);
        float shoreFactor = smoothstep(12.0, 24.0, distFromCenter);

        vec3 waterColor = mix(uShallowColor, uDeepColor, shoreFactor);

        // Dynamic Foam Lines
        float foamPattern = sin(vWorldPosition.x * 0.5 + uTime * 2.0) * cos(vWorldPosition.z * 0.5 + uTime * 2.0);
        float foam = smoothstep(0.4, 0.8, foamPattern + vWaveHeight * 2.0);

        vec3 finalColor = mix(waterColor, uFoamColor, foam * 0.35);

        gl_FragColor = vec4(finalColor, 0.82);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.y = 0.6;
    scene.add(this.mesh);
  }

  update(time) {
    this.uniforms.uTime.value = time;
  }
}
