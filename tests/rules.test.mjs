import { test } from "node:test";
import assert from "node:assert/strict";
import {
  findConjugationTarget,
  getAbilityAvailability,
  getRunScore,
  getSwimmingSpeed,
} from "../src/domain/game-rules.mjs";
import createHudState from "../src/ui/create-hud-state.mjs";
import { createWorldRenderState } from "../src/rendering/create-world-render-state.mjs";
import { loadScoreboard, saveRunScore } from "../src/domain/score-store.mjs";

function state(changes = {}) {
  return {
    alive: true,
    dying: false,
    fissioning: false,
    paused: false,
    showingInstructions: false,
    tumbling: false,
    energy: 150,
    bacterioTimer: 0,
    activeGenes: new Set(),
    conjTarget: null,
    player: { x: 0, y: 0 },
    predator: { x: 300, y: 300 },
    daughters: [],
    npcCells: [],
    elapsedMs: 12000,
    killCount: 2,
    temp: 37,
    divisionCount: 0,
    fissionScale: { x: 1, y: 1 },
    ...changes,
  };
}

test("HUD and commands share exact division and burst thresholds", () => {
  for (const energy of [0, 29.99, 30, 149.99, 150, 150.01, 200]) {
    const run = state({ energy });
    const available = getAbilityAvailability(run, null);
    const hud = createHudState(run);
    assert.equal(hud.actions.divide.enabled, available.divide);
    assert.equal(hud.actions.burst.enabled, available.burst);
    assert.equal(available.divide, energy > 150);
    assert.equal(available.burst, energy >= 30);
  }
});

test("all gameplay actions are gated during pause, instructions, division and death", () => {
  for (const change of [
    { paused: true },
    { showingInstructions: true },
    { fissioning: true },
    { alive: false },
    { dying: true },
  ]) {
    const available = getAbilityAvailability(state({ energy: 200, ...change }), {});
    assert.ok(Object.values(available).every((value) => !value));
  }
});

test("conjugation selects the nearest live cell with an unowned gene inside range", () => {
  const duplicate = { x: 5, y: 0, active: true, genes: new Set(["HSP"]) };
  const useful = { x: 60, y: 0, active: true, genes: new Set(["HSP", "TOXIN"]) };
  const distant = { x: 140, y: 0, active: true, genes: new Set(["CSP"]) };
  const dead = { x: 1, y: 0, active: false, genes: new Set(["CSP"]) };
  assert.equal(
    findConjugationTarget({ x: 0, y: 0 }, [duplicate, distant, dead, useful], new Set(["HSP"])),
    useful,
  );
  assert.equal(findConjugationTarget({ x: 0, y: 0 }, [duplicate, distant, dead], new Set(["HSP"])), null);
});

test("swimming speed composes gene effects consistently for keys and swipes", () => {
  assert.equal(getSwimmingSpeed(new Set()), 280);
  assert.equal(getSwimmingSpeed(new Set(["FLAGELLUM", "MEMBRANE"])), 280 * 1.4 * 0.85);
});

test("render snapshots contain appearance only and cannot mutate physics or gene ownership", () => {
  const run = state({
    activeGenes: new Set(["HSP"]),
    player: { x: 20, y: 30, rotation: 0, body: { velocity: { x: 10, y: 20 } } },
  });
  const snapshot = createWorldRenderState(run);
  assert.equal(snapshot.player.body, undefined);
  snapshot.player.x = 500;
  snapshot.activeGenes.clear();
  snapshot.fissionScale.x = 0;
  assert.equal(run.player.x, 20);
  assert.equal(run.activeGenes.size, 1);
  assert.equal(run.fissionScale.x, 1);
});

test("score derives from active simulation time and the HUD uses the same formula", () => {
  assert.equal(getRunScore(12999, 2), 320);
  const hud = createHudState(state({ elapsedMs: 12999 }));
  assert.equal(hud.score, 320);
});

test("score storage rejects malformed records and preserves the best twenty", () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
  values.set("ucg_scores", JSON.stringify([null, {}, { name: "bad", score: 1 }]));
  assert.deepEqual(loadScoreboard(storage).scores, []);
  for (let score = 0; score < 25; score++)
    saveRunScore({ name: "test", score, elapsed: score, kills: 0 }, storage);
  const result = loadScoreboard(storage);
  assert.equal(result.scores.length, 20);
  assert.equal(result.scores[0].score, 24);
  assert.equal(result.scores[19].score, 5);
  assert.equal(result.lastName, "test");
});

test("unavailable storage never prevents another run", () => {
  const storage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
  };
  assert.deepEqual(loadScoreboard(storage), { scores: [], lastName: "" });
  assert.doesNotThrow(() => saveRunScore({ name: "test", score: 10, elapsed: 1, kills: 0 }, storage));
});
