import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "../vendor/three.mjs";
import {
  getRenderBudget,
  getCameraFrame,
  getDivisionVertex,
  isInFrame,
} from "../src/rendering/three/render-budget.mjs";
import {
  createCellResources,
  createCellModel,
  updateCellModel,
  disposeCellModel,
} from "../src/rendering/three/cell-models.mjs";
import { createInstanceBatch, disposeScene } from "../src/rendering/three/scene-decoration.mjs";
import { PAL } from "../src/rendering/palettes.mjs";

test("phone, landscape and high-DPI render buffers stay within their pixel budgets", () => {
  for (const [width, height, dpr, coarse] of [
    [390, 844, 3, true],
    [844, 390, 3, true],
    [768, 1024, 2, true],
    [1280, 720, 2, false],
    [3840, 2160, 2, false],
  ]) {
    const budget = getRenderBudget(width, height, dpr, coarse);
    assert.ok(width * height * budget.pixelRatio ** 2 <= (budget.mobile ? 850000 : 1500000) + 1);
    assert.ok(budget.pixelRatio <= (budget.mobile ? 1.25 : 1.5));
  }
});

test("orthographic framing preserves the Phaser plane centre and zoom", () => {
  const frame = getCameraFrame({ width: 390, height: 844, zoom: 0.7, scrollX: 1405, scrollY: 1178 });
  assert.equal(frame.x, 1600);
  assert.equal(frame.y, -1600);
  assert.equal(frame.width, 390 / 0.7);
  assert.equal(frame.height, 844 / 0.7);
  assert.equal(isInFrame({ x: 1600, y: 1600 }, frame), true);
  assert.equal(isInFrame({ x: 0, y: 0 }, frame), false);
});

test("3D division pinches the centre while preserving finite ends", () => {
  assert.ok(getDivisionVertex(12, 0, 0, 1)[0] < 0.4);
  assert.ok(getDivisionVertex(12, 55, 0, 1)[0] > 11.9);
  for (let p = 0; p <= 1; p += 0.1)
    for (const y of [-62, -30, 0, 30, 62]) assert.ok(getDivisionVertex(12, y, 5, p).every(Number.isFinite));
});

test("player division owns its deformable geometry and leaves shared NPC shapes intact", () => {
  const resources = createCellResources();
  const before = resources.rod.attributes.position.array.slice();
  const model = createCellModel(resources, "rod", PAL.player, true);
  const cell = { x: 1600, y: 1600, rotation: 0, active: true };
  const state = {
    flagPhase: 1,
    playerAlpha: 1,
    playerColour: PAL.player.outer,
    feedGlow: 0,
    fissionScale: { x: 1, y: 1 },
    activeGenes: new Set(),
    fissioning: true,
    fissionProgress: 0.8,
  };
  updateCellModel(model, cell, 0.78, state);
  assert.notEqual(model.body.geometry, resources.rod);
  assert.deepEqual(resources.rod.attributes.position.array, before);
  assert.ok(model.body.geometry.attributes.position.array.every(Number.isFinite));
  assert.equal(model.secondNucleus.visible, true);
  state.fissioning = false;
  updateCellModel(model, cell, 0.78, state);
  assert.equal(model.secondNucleus.visible, false);
  assert.deepEqual(model.body.geometry.attributes.position.array, before);
  disposeCellModel(model);
  Object.values(resources).forEach((g) => g.dispose());
});

test("instanced pickup batches enforce capacity, reuse objects and reset counts", () => {
  const scene = new T.Scene();
  const batch = createInstanceBatch(scene, new T.SphereGeometry(1, 6, 4), new T.MeshBasicMaterial(), 2);
  batch.begin();
  for (let i = 0; i < 5; i++) batch.add(i, -i, 0, 1, 1, 1, 0xffaa44);
  batch.end();
  assert.equal(batch.mesh.count, 2);
  const matrix = batch.mesh.instanceMatrix;
  batch.begin();
  batch.add(0, 0, 0, 2, 2, 2, 0xffffff);
  batch.end();
  assert.equal(batch.mesh.count, 1);
  assert.equal(batch.mesh.instanceMatrix, matrix);
  assert.deepEqual(matrix.updateRanges, [{ start: 0, count: 16 }]);
  disposeScene(scene);
});

test("shared rendering resources are disposed once at scene shutdown", () => {
  const scene = new T.Scene();
  const geometry = new T.SphereGeometry(1, 6, 4);
  const material = new T.MeshBasicMaterial();
  let geometries = 0,
    materials = 0;
  geometry.addEventListener("dispose", () => geometries++);
  material.addEventListener("dispose", () => materials++);
  scene.add(new T.Mesh(geometry, material), new T.Mesh(geometry, material));
  disposeScene(scene, [geometry]);
  assert.equal(geometries, 1);
  assert.equal(materials, 1);
});
