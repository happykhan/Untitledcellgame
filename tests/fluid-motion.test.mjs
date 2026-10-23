import { test } from "node:test";
import assert from "node:assert/strict";
import { swimInFluid, angleDifference } from "../src/input/movement.mjs";

const initial = (changes = {}) => ({
  heading: 0,
  turnRate: 0,
  velocity: { x: 0, y: 0 },
  direction: { x: 1, y: 0 },
  speed: 280,
  ...changes,
});
function advance(state, seconds, fps = 60) {
  for (let i = 0; i < Math.round(seconds * fps); i++)
    state = { ...state, ...swimInFluid({ ...state, dt: 1 / fps }) };
  return state;
}

test("a reversal rotates the body before propelling it in the new direction", () => {
  let state = initial({ velocity: { x: 280, y: 0 }, direction: { x: -1, y: 0 } });
  const first = swimInFluid({ ...state, dt: 1 / 60 });
  assert.ok(first.velocity.x > 0, "no instant backward slide");
  assert.ok(Math.abs(first.heading) < 0.06, "no instant rod rotation");
  state = advance(state, 2);
  assert.ok(Math.abs(angleDifference(Math.PI, state.heading)) < 0.03);
  assert.ok(state.velocity.x < -270);
});

test("swimming follows the long axis with little sideways slip during a turn", () => {
  let state = initial({ velocity: { x: 280, y: 0 }, direction: { x: 0, y: 1 } });
  for (let i = 0; i < 90; i++) {
    state = { ...state, ...swimInFluid({ ...state, dt: 1 / 60 }) };
    const lateral = -state.velocity.x * Math.sin(state.heading) + state.velocity.y * Math.cos(state.heading);
    assert.ok(Math.abs(lateral) < 40);
  }
  assert.ok(state.velocity.y > 270);
});

test("release rapidly damps swimming relative to the fluid at multiple frame rates", () => {
  for (const fps of [30, 60, 120]) {
    const result = advance(initial({ velocity: { x: 280, y: 60 }, direction: { x: 0, y: 0 } }), 0.5, fps);
    assert.ok(Math.hypot(result.velocity.x, result.velocity.y) < 0.4);
  }
});

test("an idle cell follows the ambient current instead of accumulating acceleration", () => {
  const state = advance(initial({ current: { x: 12, y: -4 }, direction: { x: 0, y: 0 } }), 10);
  assert.ok(Math.abs(state.velocity.x - 12) < 0.01);
  assert.ok(Math.abs(state.velocity.y + 4) < 0.01);
});

test("a tumble reorients a stopped cell without a sideways thrust impulse", () => {
  const state = advance(initial({ tumbling: true, tumbleDirection: 1 }), 0.35);
  assert.ok(state.heading > 1.5);
  assert.equal(Math.hypot(state.velocity.x, state.velocity.y), 0);
});

test("turns remain stable across 30, 60 and 120 Hz", () => {
  const results = [30, 60, 120].map((fps) => advance(initial({ direction: { x: 0, y: 1 } }), 1, fps));
  for (const result of results) {
    assert.ok(Math.abs(result.heading - Math.PI / 2) < 0.04);
    assert.ok(result.velocity.y > 265);
  }
});
