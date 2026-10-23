import { test } from "node:test";
import assert from "node:assert/strict";
import { drawDividingCell } from "../src/rendering/cell-shapes.mjs";
import { PAL } from "../src/rendering/palettes.mjs";
import { getViewportSettings } from "../src/config.mjs";

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
globalThis.Phaser = {
  Scene: class {},
  Math: {
    Linear: (a, b, t) => a + (b - a) * t,
    Clamp: clamp,
    RadToDeg: (a) => (a * 180) / Math.PI,
    Angle: { RotateTo: (a, b, step) => a + clamp(Math.atan2(Math.sin(b - a), Math.cos(b - a)), -step, step) },
  },
};
const { default: GameScene } = await import("../src/game-scene.mjs");

function image(x = 1600, y = 1600) {
  const obj = {
    x,
    y,
    active: true,
    rotation: 0,
    setScale(n) {
      this.scale = n;
      return this;
    },
    destroy() {
      this.active = false;
    },
    body: {
      velocity: { x: 0, y: 0 },
      setVelocity(x, y) {
        this.velocity = { x, y };
        return this;
      },
      setAcceleration(x, y) {
        this.acceleration = { x, y };
        return this;
      },
      setCircle() {},
    },
    setPosition(x, y) {
      this.x = x;
      this.y = y;
      return this;
    },
  };
  for (const method of [
    "setAlpha",
    "setCollideWorldBounds",
    "setBounce",
    "setDamping",
    "setDrag",
    "setMaxVelocity",
    "setDepth",
    "setVisible",
  ])
    obj[method] = () => obj;
  return obj;
}
function scene() {
  const s = new GameScene();
  Object.assign(s, {
    alive: true,
    dying: false,
    energy: 175,
    fissioning: false,
    player: image(),
    activeGenes: new Set(["HSP", "MEMBRANE"]),
    daughters: [],
    divisionCount: 0,
    nextCellId: 0,
    foodGroup: { getChildren: () => [] },
    geneGroup: { getChildren: () => [] },
    fxGfx: { clear() {} },
    time: { now: 0 },
    hud: { notify() {} },
    swimInput: { reset() {} },
    viewport: getViewportSettings(1200, 800),
    tweens: {
      add(config) {
        s.lastTween = config;
      },
    },
    physics: { add: { image, overlap() {} } },
  });
  return s;
}

test("division gates exactly at 150, freezes thrust and cannot be started twice", () => {
  const s = scene();
  s.energy = 150;
  s._triggerFission();
  assert.equal(s.fissioning, false);
  s.energy = 150.1;
  s.player.body.setVelocity(200, 100);
  s._triggerFission();
  assert.equal(s.fissioning, true);
  assert.equal(s.player.body.velocity.x, 0);
  assert.equal(s.player.body.acceleration.x, 0);
  const tween = s.lastTween;
  s._triggerFission();
  assert.equal(s.lastTween, tween);
  assert.equal(tween.duration, 1200);
});

test("division produces one daughter with independent inherited genes, recoil and energy reset", () => {
  const s = scene();
  s.player.rotation = Math.PI / 2;
  const genes = s.activeGenes;
  s._triggerFission();
  s.lastTween.onComplete();
  assert.equal(s.daughters.length, 1);
  assert.equal(s.divisionCount, 1);
  assert.equal(s.energy, 80);
  assert.equal(s.fissioning, false);
  assert.equal(s.activeGenes.size, 0);
  const d = s.daughters[0];
  assert.deepEqual([...d.genes], [...genes]);
  assert.notEqual(d.genes, genes);
  assert.ok(d.x < s.player.x);
  assert.ok(Math.abs(d.y - s.player.y) < 0.001);
  assert.ok(d.body.velocity.x < 0);
  assert.ok(s.player.body.velocity.x > 0);
});

test("division keeps both cell centres within the world at its edge", () => {
  const s = scene();
  s.player.setPosition(3199, 1);
  s.player.rotation = Math.PI / 2;
  s._triggerFission();
  s.lastTween.onComplete();
  for (const c of [s.player, ...s.daughters]) {
    assert.ok(c.x >= 20 && c.x <= 3180);
    assert.ok(c.y >= 20 && c.y <= 3180);
  }
});

test("nutrient collection is idempotent, capped and animates toward the moving cell", () => {
  const s = scene();
  s.energy = 190;
  const food = {
    active: true,
    x: 100,
    y: 100,
    destroy() {
      this.active = false;
    },
  };
  let particle;
  s.add = { image: (x, y) => (particle = image(x, y)) };
  s._eatFood(s.player, food);
  assert.equal(s.energy, 200);
  assert.equal(s.feedGlow, 1);
  const tween = s.lastTween;
  s._eatFood(s.player, food);
  assert.equal(s.lastTween, tween);
  tween.targets.progress = 0.5;
  s.player.setPosition(200, 300);
  tween.onUpdate();
  assert.equal(particle.x, 150);
  assert.equal(particle.y, 200);
  assert.ok(particle.scale < 1);
  tween.onComplete();
  assert.equal(particle.active, false);
  assert.equal(tween.duration, 260);
});

test("division membrane geometry stays finite throughout the pinch", () => {
  const coords = [];
  const g = {};
  for (const method of [
    "beginPath",
    "moveTo",
    "lineTo",
    "closePath",
    "fillStyle",
    "fillPath",
    "lineStyle",
    "strokePath",
    "fillTriangle",
  ])
    g[method] = (...args) => coords.push(...args);
  for (const p of [0, 0.25, 0.5, 0.75, 1]) drawDividingCell(g, 100, 100, Math.PI / 3, 0.5, p, PAL.player);
  assert.ok(coords.length > 1000);
  assert.ok(coords.every(Number.isFinite));
});

test("conjugation cancels before transfer if the target moves out of range", () => {
  const s = scene();
  s.conjTarget = { active: true, x: 1900, y: 1600, genes: new Set(["TOXIN"]) };
  s.conjTimer = 1790;
  let cleared = false;
  s.fxGfx.clear = () => {
    cleared = true;
  };
  s._updateConjugation(20);
  assert.equal(s.conjTarget, null);
  assert.equal(s.activeGenes.has("TOXIN"), false);
  assert.equal(cleared, true);
});

test("feeding clears the low-energy pulse and a pending pulse does not restart it", () => {
  const s = scene();
  s.energy = 20;
  s.dyingPulse = true;
  s.add = { image };
  s._eatFood(s.player, { active: true, x: 0, y: 0, destroy() {} });
  assert.equal(s.dyingPulse, false);
  assert.equal(s.playerAlpha, 1);
  s.time.delayedCall = () => {
    throw new Error("pulse should have stopped");
  };
  s._pulseLow();
});

test("pause freezes the simulation clock without a wall-clock adjustment", () => {
  const s = scene();
  s.elapsedMs = 5000;
  s.paused = true;
  s.update(90000, 5000);
  assert.equal(s.elapsedMs, 5000);
});

test("the finished round stops submitting 3D frames behind the score screen", () => {
  const s = scene();
  s.elapsedMs = 5000;
  s.roundOver = true;
  s.worldView = {
    update() {
      throw new Error("finished rounds must not submit frames");
    },
  };
  s.update(90000, 16);
  assert.equal(s.elapsedMs, 5000);
});

test("a dying cell still renders its shrinking membrane while its score stays frozen", () => {
  const s = scene();
  let displayedState;
  Object.assign(s, {
    alive: false,
    dying: true,
    elapsedMs: 5000,
    flagSpeed: 0,
    flagPhase: 0,
    playerAlpha: 1,
    feedGlow: 0,
    fissionScale: { x: 0.4, y: 0.4 },
    npcCells: [],
    predator: { x: 2500, y: 2500 },
    worldView: {
      update(settings, state) {
        displayedState = state;
      },
    },
    cameras: { main: {} },
    swimInput: { draw() {} },
    _updateHUD() {},
  });
  s.update(90000, 16);
  assert.deepEqual(displayedState.fissionScale, { x: 0.4, y: 0.4 });
  assert.equal(s.elapsedMs, 5000);
});

test("the starting food patch is explicit even when a previous player object exists", () => {
  const s = scene();
  const positions = [];
  s.foodGroup = {
    create(x, y) {
      positions.push({ x, y });
      return image(x, y);
    },
  };
  const patch = { x: 1700, y: 1400 };
  s._spawnFood(1, patch);
  assert.ok(Math.hypot(positions[0].x - patch.x, positions[0].y - patch.y) <= 150);
  assert.deepEqual(patch, { x: 1700, y: 1400 });
});

test("keyboard movement uses screen directions, normalises diagonals and brakes on release", () => {
  const s = scene();
  const keys = {
    up: { isDown: true },
    down: { isDown: false },
    left: { isDown: false },
    right: { isDown: true },
    space: { isDown: false },
  };
  s.cursors = keys;
  s.wasd = keys;
  s.swimInput = { vector: { x: 0, y: 0 }, gesture: null };
  s.thrustAngle = Math.PI;
  s._handleMovement(50, 0.05);
  const v = s.player.body.velocity;
  assert.ok(v.x > 0 && v.y < 0);
  assert.ok(Math.abs(v.x + v.y) < 1e-8);
  assert.ok(Math.hypot(v.x, v.y) < 280 * 1.8);
  keys.up.isDown = keys.right.isDown = false;
  for (let i = 0; i < 5; i++) s._handleMovement(50, 0.05);
  assert.ok(Math.hypot(s.player.body.velocity.x, s.player.body.velocity.y) < 3);
});

test("score entry releases captured gameplay keys and a new run restores them", () => {
  const s = scene();
  const previousDocument = globalThis.document;
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem() {
        return null;
      },
    },
  });
  const previousInput = Phaser.Input;
  let captured = true;
  let resets = 0;
  s.elapsedMs = 1000;
  s.killCount = 0;
  s.hud.root = {};
  s.input = {
    keyboard: {
      disableGlobalCapture() {
        captured = false;
      },
      enableGlobalCapture() {
        captured = true;
      },
      resetKeys() {
        resets++;
      },
      createCursorKeys() {
        return {};
      },
      addKeys() {
        return {};
      },
    },
  };
  globalThis.document = {
    createElement() {
      return { style: {}, remove() {} };
    },
    body: {
      appendChild() {
        assert.equal(captured, false, "release keys before presenting the text field");
      },
    },
  };
  Phaser.Input = { Keyboard: { KeyCodes: {} } };
  try {
    s._showGameOver("TEST");
    assert.equal(captured, false);
    assert.equal(resets, 1);
    s.closeOverlay();
    s._setupKeyboard();
    assert.equal(captured, true);
  } finally {
    s.closeOverlay?.();
    globalThis.document = previousDocument;
    if (previousStorage) Object.defineProperty(globalThis, "localStorage", previousStorage);
    else delete globalThis.localStorage;
    Phaser.Input = previousInput;
  }
});
