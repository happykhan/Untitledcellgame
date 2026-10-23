import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import SwimInput, { getSwimVector } from "../src/input/swim-input.mjs";
import { steerVelocity } from "../src/input/movement.mjs";

function setup() {
  const input = new EventEmitter();
  const lifecycle = new EventTarget();
  let active = true;
  const control = new SwimInput({
    input,
    lifecycle,
    guide: { clear() {}, update() {}, destroy() {} },
    canSwim: () => active,
  });
  return { input, control, lifecycle, disable: () => (active = false) };
}

test("steering starts before release, reverses while held and stops on release", () => {
  const { input, control } = setup();
  input.emit("pointerdown", { id: 1, x: 60, y: 60 });
  input.emit("pointermove", { id: 1, x: 108, y: 60 });
  assert.deepEqual(control.vector, { x: 1, y: 0 });
  input.emit("pointermove", { id: 1, x: 12, y: 60 });
  assert.deepEqual(control.vector, { x: -1, y: 0 });
  input.emit("pointerup", { id: 1, x: 12, y: 60 });
  assert.deepEqual(control.vector, { x: 0, y: 0 });
  control.destroy();
  assert.equal(input.eventNames().length, 0);
});

test("second finger cannot steal or release steering", () => {
  const { input, control } = setup();
  input.emit("pointerdown", { id: 1, x: 60, y: 60 });
  input.emit("pointermove", { id: 1, x: 108, y: 60 });
  input.emit("pointerdown", { id: 2, x: 100, y: 100 });
  input.emit("pointermove", { id: 2, x: 20, y: 20 });
  input.emit("pointerup", { id: 2 });
  assert.deepEqual(control.vector, { x: 1, y: 0 });
  control.destroy();
});

test("cancel, focus loss, leaving the canvas and loss of control clear held input", () => {
  for (const reason of ["touchcancel", "blur", "gameout", "pause"]) {
    const { input, control, lifecycle, disable } = setup();
    input.emit("pointerdown", { id: 1, x: 60, y: 60 });
    input.emit("pointermove", { id: 1, x: 108, y: 60 });
    if (reason === "pause") disable();
    else if (reason === "gameout") input.emit(reason);
    else lifecycle.dispatchEvent(new Event(reason));
    assert.deepEqual(control.vector, { x: 0, y: 0 }, reason);
    assert.equal(control.gesture, null);
    control.destroy();
  }
});

test("thumb jitter is ignored, short drags are slower and long diagonals are capped", () => {
  assert.deepEqual(getSwimVector({ startX: 0, startY: 0, x: 4, y: 3 }), { x: 0, y: 0 });
  const slow = getSwimVector({ startX: 0, startY: 0, x: 24, y: 0 });
  assert.ok(slow.x > 0 && slow.x < 0.5);
  const diagonal = getSwimVector({ startX: 0, startY: 0, x: 300, y: 300 });
  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.y) - 1) < 1e-10);
});

test("release brakes to less than 1 percent in a quarter second at different frame rates", () => {
  for (const fps of [30, 60, 120]) {
    let velocity = { x: 500, y: -200 };
    for (let i = 0; i < Math.ceil(fps / 4); i++)
      velocity = steerVelocity(velocity, { x: 0, y: 0 }, 500, 1 / fps);
    assert.ok(Math.hypot(velocity.x, velocity.y) < 5.4);
  }
});

test("steering reverses a moving cell promptly without exceeding target speed", () => {
  let velocity = { x: 500, y: 0 };
  for (let i = 0; i < 6; i++) velocity = steerVelocity(velocity, { x: -1, y: 0 }, 500, 1 / 60);
  assert.ok(velocity.x < -250 && velocity.x >= -500);
});
