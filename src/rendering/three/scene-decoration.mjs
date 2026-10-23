import * as T from "../../../vendor/three.mjs";
import { WORLD_W, WORLD_H } from "../../config.mjs";

export function createInstanceBatch(scene, geometry, material, capacity) {
  const mesh = new T.InstancedMesh(geometry, material, capacity);
  mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.count = 0;
  scene.add(mesh);
  const transform = new T.Object3D();
  const colour = new T.Color();
  let count = 0;
  return {
    mesh,
    begin() {
      count = 0;
    },
    add(x, y, z, sx, sy, sz, hex, rotation = 0) {
      if (count >= capacity) return;
      transform.position.set(x, y, z);
      transform.rotation.set(0, 0, rotation);
      transform.scale.set(sx, sy, sz);
      transform.updateMatrix();
      mesh.setMatrixAt(count, transform.matrix);
      mesh.setColorAt(count, colour.setHex(hex));
      count++;
    },
    end() {
      mesh.count = count;
      if (count > 0) {
        mesh.instanceMatrix.clearUpdateRanges();
        mesh.instanceMatrix.addUpdateRange(0, count * 16);
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) {
          mesh.instanceColor.clearUpdateRanges();
          mesh.instanceColor.addUpdateRange(0, count * 3);
          mesh.instanceColor.needsUpdate = true;
        }
      }
    },
  };
}

export function createFilaments(scene) {
  const capacity = 10000;
  const positions = new Float32Array(capacity * 3);
  const colours = new Float32Array(capacity * 3);
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.BufferAttribute(positions, 3).setUsage(T.DynamicDrawUsage));
  geometry.setAttribute("color", new T.BufferAttribute(colours, 3).setUsage(T.DynamicDrawUsage));
  const lines = new T.LineSegments(
    geometry,
    new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.66, depthWrite: false }),
  );
  lines.frustumCulled = false;
  scene.add(lines);
  const colour = new T.Color();
  let count = 0;
  return {
    begin() {
      count = 0;
    },
    segment(x1, y1, z1, x2, y2, z2, hex) {
      if (count + 2 > capacity) return;
      colour.setHex(hex);
      const offset = count * 3;
      positions[offset] = x1;
      positions[offset + 1] = y1;
      positions[offset + 2] = z1;
      positions[offset + 3] = x2;
      positions[offset + 4] = y2;
      positions[offset + 5] = z2;
      for (let i = 0; i < 2; i++) {
        colours[offset + i * 3] = colour.r;
        colours[offset + i * 3 + 1] = colour.g;
        colours[offset + i * 3 + 2] = colour.b;
      }
      count += 2;
    },
    end() {
      geometry.setDrawRange(0, count);
      if (count > 0) {
        for (const attribute of [geometry.attributes.position, geometry.attributes.color]) {
          attribute.clearUpdateRanges();
          attribute.addUpdateRange(0, count * 3);
          attribute.needsUpdate = true;
        }
      }
    },
  };
}

export function createFluidBackground(scene, ghostCount) {
  const material = new T.ShaderMaterial({
    uniforms: { time: { value: 0 }, heat: { value: 0 }, cold: { value: 0 } },
    vertexShader: `varying vec2 field; void main() { field = position.xy / 3200.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec2 field; uniform float time; uniform float heat; uniform float cold;
      void main() {
        float light = sin(field.x * 12.0 + time * 0.018) * cos(field.y * 9.0 - time * 0.012) * 0.5 + 0.5;
        float current = sin((field.x + field.y) * 26.0 + sin(field.x * 8.0) + time * 0.024) * 0.5 + 0.5;
        vec3 base = mix(vec3(0.016,0.035,0.061), vec3(0.026,0.090,0.109), light * 0.7 + current * 0.12);
        base += heat * vec3(0.026,0.006,0.0) + cold * vec3(0.0,0.012,0.035);
        gl_FragColor = vec4(base,1.0);
      }`,
    depthWrite: false,
  });
  const fluid = new T.Mesh(new T.PlaneGeometry(WORLD_W * 3, WORLD_H * 3), material);
  fluid.position.set(WORLD_W / 2, -WORLD_H / 2, -180);
  scene.add(fluid);

  const ghostGeometry = new T.SphereGeometry(1, 8, 6);
  const ghosts = createInstanceBatch(
    scene,
    ghostGeometry,
    new T.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.14, depthWrite: false }),
    ghostCount,
  );
  ghosts.begin();
  for (let i = 0; i < ghostCount; i++) {
    const x = ((((Math.sin(i * 127.1) * 43758.5453) % 1) + 1) % 1) * WORLD_W;
    const y = ((((Math.sin(i * 311.7) * 96321.517) % 1) + 1) % 1) * WORLD_H;
    ghosts.add(x, -y, -55 - (i % 4) * 20, 9 + (i % 4), 22 + (i % 7) * 5, 5, 0x52787b, i * 2.4);
  }
  ghosts.end();

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 32;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, "rgba(210,241,226,0.7)");
  gradient.addColorStop(0.25, "rgba(140,199,181,0.25)");
  gradient.addColorStop(1, "rgba(140,199,181,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 32, 32);
  const positions = new Float32Array(120 * 3);
  for (let i = 0; i < 120; i++)
    positions.set([(i * 613) % WORLD_W, -((i * 977) % WORLD_H), -15 - (i % 5) * 18], i * 3);
  const dustGeometry = new T.BufferGeometry();
  dustGeometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  const dust = new T.Points(
    dustGeometry,
    new T.PointsMaterial({
      map: new T.CanvasTexture(canvas),
      size: 22,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    }),
  );
  scene.add(dust);
  return {
    update(time, temperature) {
      material.uniforms.time.value = time;
      material.uniforms.heat.value = Math.max(0, Math.min(1, (temperature - 42) / 28));
      material.uniforms.cold.value = Math.max(0, Math.min(1, (30 - temperature) / 20));
      dust.position.set(Math.sin(time * 0.04) * 14, Math.cos(time * 0.025) * 10, 0);
    },
  };
}

export function disposeScene(scene, extraGeometries = []) {
  const geometries = new Set(extraGeometries);
  const materials = new Set();
  const textures = new Set();
  scene.traverse((object) => {
    if (object.isInstancedMesh) object.dispose();
    if (object.geometry) geometries.add(object.geometry);
    for (const material of Array.isArray(object.material)
      ? object.material
      : object.material
        ? [object.material]
        : []) {
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
}
