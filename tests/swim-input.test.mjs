import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import SwimInput from "../src/input/swim-input.mjs";

test("a second finger cannot steal a swim gesture and leaving the canvas cancels it", () => {
  const input = new EventEmitter();
  const strokes = [];
  let destroyed = false;
  const control = new SwimInput({
    input,
    graphics: {
      clear() {},
      destroy() {
        destroyed = true;
      },
    },
    canSwim: () => true,
    onStroke: (...stroke) => strokes.push(stroke),
  });
  input.emit("pointerdown", { id: 1, x: 10, y: 10 });
  input.emit("pointerdown", { id: 2, x: 100, y: 100 });
  input.emit("pointerup", { id: 2, x: 150, y: 150 });
  assert.equal(strokes.length, 0);
  input.emit("pointerup", { id: 1, x: 40, y: 60 });
  assert.deepEqual(strokes, [[30, 50]]);
  input.emit("pointerdown", { id: 1, x: 10, y: 10 });
  input.emit("gameout");
  input.emit("pointerup", { id: 1, x: 100, y: 100 });
  assert.equal(strokes.length, 1);
  control.destroy();
  assert.equal(input.eventNames().length, 0);
  assert.equal(destroyed, true);
});

test("pause or division between press and release suppresses a stroke", () => {
  const input = new EventEmitter();
  let active = true;
  let strokes = 0;
  const control = new SwimInput({
    input,
    graphics: { clear() {}, destroy() {} },
    canSwim: () => active,
    onStroke: () => strokes++,
  });
  input.emit("pointerdown", { id: 1, x: 10, y: 10 });
  active = false;
  input.emit("pointerup", { id: 1, x: 100, y: 100 });
  assert.equal(strokes, 0);
  control.destroy();
});
