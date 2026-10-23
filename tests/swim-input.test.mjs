import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import SwimInput, { getSwimVector } from "../src/input/swim-input.mjs";

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
