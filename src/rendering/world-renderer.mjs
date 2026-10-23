import { GENES, WORLD_W, WORLD_H } from "../config.mjs";
import { PAL, getPlayerPalette } from "./palettes.mjs";
import {
  drawBacteria,
  drawBacteriaSimple,
  drawCoccus,
  drawDividingCell,
  drawPredator,
  drawVibrio,
  fillCapsule,
} from "./cell-shapes.mjs";

export function createWorldLayers(add) {
  const layers = {
    background: add.graphics(),
    cells: add.graphics().setDepth(9),
    flagella: add.graphics().setDepth(8),
    organelles: add.graphics().setDepth(11),
  };
  drawBackground(layers.background);
  return layers;
}

function isVisible(cell, view) {
  const margin = 160;
  return (
    cell.x >= view.x - margin &&
    cell.x <= view.right + margin &&
    cell.y >= view.y - margin &&
    cell.y <= view.bottom + margin
  );
}

// Snapshot has positions, appearance and animation values only. Physics stays in GameScene.
export function renderWorld(layers, camera, settings, state) {
  layers.cells.clear();
  layers.flagella.clear();
  layers.organelles.clear();
  const g = layers.cells,
    fg = layers.flagella,
    og = layers.organelles;
  const pal = getPlayerPalette(state.activeGenes);
  const pa = state.playerAlpha;

  const stretch = 1 + state.flagSpeed * 0.04;
  const rx = (12 * settings.cellScale * state.fissionScale.x) / stretch;
  const ry = 38 * settings.cellScale * state.fissionScale.y * stretch;
  const angle = state.player.rotation;

  if (state.fissioning) {
    drawDividingCell(
      g,
      state.player.x,
      state.player.y,
      angle,
      settings.cellScale,
      state.fissionProgress,
      pal,
    );
  } else {
    drawBacteria(g, state.player.x, state.player.y, angle, rx, ry, pal, pa, state.flagPhase, settings.detail);
    if (state.feedGlow > 0) {
      g.fillStyle(0xffcf75, state.feedGlow * 0.24);
      fillCapsule(g, state.player.x, state.player.y, rx * 0.72, ry * 0.75, Math.cos(angle), Math.sin(angle));
    }
  }
  drawOrganelles(
    og,
    state.player.x,
    state.player.y,
    angle,
    pal.outer,
    pa,
    settings.cellScale,
    state.activeGenes,
  );

  const pRear = 38 * settings.cellScale;
  drawFlagellum(
    fg,
    state.player.x,
    state.player.y,
    angle,
    state.flagPhase,
    pal,
    pa,
    pRear,
    state.flagSpeed,
    settings.detail,
  );
  if (state.activeGenes.has("FLAGELLUM")) {
    drawFlagellum(
      fg,
      state.player.x,
      state.player.y,
      angle + 0.35,
      state.flagPhase + Math.PI,
      pal,
      pa,
      pRear,
      state.flagSpeed,
      settings.detail,
    );
  }

  drawPredator(
    g,
    state.predator.x,
    state.predator.y,
    58 * settings.cellScale,
    46 * settings.cellScale,
    1.0,
    state.flagPhase,
  );

  state.daughters.forEach((d) => {
    if (!d.active || !isVisible(d, camera.worldView)) return;
    const da = Phaser.Math.DegToRad(d.angle - 90);
    drawBacteria(
      g,
      d.x,
      d.y,
      da,
      8 * settings.cellScale,
      32 * settings.cellScale,
      PAL.daughter,
      1.0,
      d.flagPhase,
      settings.detail,
    );
    drawFlagellum(
      fg,
      d.x,
      d.y,
      da,
      d.flagPhase,
      PAL.daughter,
      1.0,
      32 * settings.cellScale,
      state.flagSpeed,
      settings.detail,
    );
  });

  state.npcCells.forEach((npc) => {
    if (!npc.active || !isVisible(npc, camera.worldView)) return;
    const na = Phaser.Math.DegToRad(npc.angle - 90);
    switch (npc.shape) {
      case "coccus":
        drawCoccus(
          g,
          npc.x,
          npc.y,
          14 * settings.cellScale,
          npc.palette,
          1.0,
          npc.flagPhase,
          settings.detail,
        );
        break;
      case "vibrio":
        drawVibrio(
          g,
          npc.x,
          npc.y,
          na,
          8 * settings.cellScale,
          44 * settings.cellScale,
          npc.palette,
          1.0,
          npc.flagPhase,
        );
        drawFlagellum(
          fg,
          npc.x,
          npc.y,
          na,
          npc.flagPhase,
          npc.palette,
          1.0,
          48 * settings.cellScale,
          state.flagSpeed,
          settings.detail,
        );
        break;
      case "filament":
        drawBacteria(
          g,
          npc.x,
          npc.y,
          na,
          4 * settings.cellScale,
          72 * settings.cellScale,
          npc.palette,
          1.0,
          npc.flagPhase,
          settings.detail,
        );
        drawFlagellum(
          fg,
          npc.x,
          npc.y,
          na,
          npc.flagPhase,
          npc.palette,
          1.0,
          74 * settings.cellScale,
          state.flagSpeed,
          settings.detail,
        );
        break;
      case "short": // coccobacillus — squat rod
        drawBacteria(
          g,
          npc.x,
          npc.y,
          na,
          12 * settings.cellScale,
          20 * settings.cellScale,
          npc.palette,
          1.0,
          npc.flagPhase,
          settings.detail,
        );
        drawFlagellum(
          fg,
          npc.x,
          npc.y,
          na,
          npc.flagPhase,
          npc.palette,
          1.0,
          22 * settings.cellScale,
          state.flagSpeed,
          settings.detail,
        );
        break;
      default: // rod
        drawBacteria(
          g,
          npc.x,
          npc.y,
          na,
          8 * settings.cellScale,
          32 * settings.cellScale,
          npc.palette,
          1.0,
          npc.flagPhase,
          settings.detail,
        );
        drawFlagellum(
          fg,
          npc.x,
          npc.y,
          na,
          npc.flagPhase,
          npc.palette,
          1.0,
          32 * settings.cellScale,
          state.flagSpeed,
          settings.detail,
        );
    }
  });

  if (Math.hypot(state.player.x - state.predator.x, state.player.y - state.predator.y) < 200) {
    drawPseudopods(layers.cells, state);
  }
}

function drawFlagellum(fg, px, py, baseAngle, phase, pal, alpha, rearDist, flagSpeed, detail) {
  const len = 65,
    segs = 20;
  const amp = 4.5 + flagSpeed * 3.5;
  const strands = detail ? [-0.12, 0, 0.12] : [0];

  strands.forEach((off, oi) => {
    const ba = baseAngle + off;
    // Rear pole of capsule (long-axis along local Y) is at (-sin, +cos) in world space
    const backX = -Math.sin(ba),
      backY = Math.cos(ba);
    // Lateral perpendicular for the sinusoidal wave
    const perpX = Math.cos(ba),
      perpY = Math.sin(ba);
    const sx = px + backX * rearDist,
      sy = py + backY * rearDist;

    fg.lineStyle(3, pal.outer, 0.07 * alpha);
    fg.beginPath();
    fg.moveTo(sx, sy);
    for (let i = 1; i <= segs; i++) {
      const t = i / segs;
      const fx = sx + backX * len * t,
        fy = sy + backY * len * t;
      const w = Math.sin(phase + oi * 1.3 + t * Math.PI * 2.8) * amp * (1 - t * 0.45);
      fg.lineTo(fx + perpX * w, fy + perpY * w);
    }
    fg.strokePath();

    fg.lineStyle(0.9, pal.outer, 0.75 * alpha);
    fg.beginPath();
    fg.moveTo(sx, sy);
    for (let i = 1; i <= segs; i++) {
      const t = i / segs;
      const fx = sx + backX * len * t,
        fy = sy + backY * len * t;
      const w = Math.sin(phase + oi * 1.3 + t * Math.PI * 2.8) * amp * (1 - t * 0.45);
      fg.lineTo(fx + perpX * w, fy + perpY * w);
    }
    fg.strokePath();
  });
}

function drawOrganelles(og, px, py, angle, outerColor, alpha, scale, activeGenes) {
  if (activeGenes.size === 0) return;
  const cos = Math.cos(angle),
    sin = Math.sin(angle);
  const rot = (x, y) => ({ x: px + x * cos - y * sin, y: py + x * sin + y * cos });
  const s = (scale || 1) * 0.55;

  if (activeGenes.has("HSP")) {
    og.fillStyle(GENES.HSP.color, 0.72 * alpha);
    [
      [-4, -44],
      [4, -44],
      [-4, 44],
      [4, 44],
      [0, -28],
      [0, 28],
    ].forEach(([x, y]) => {
      const p = rot(x * s, y * s);
      og.fillCircle(p.x, p.y, 2.8 * s);
    });
  }
  if (activeGenes.has("CSP")) {
    og.fillStyle(GENES.CSP.color, 0.62 * alpha);
    for (let i = -3; i <= 3; i++) {
      const p = rot(0, i * 16 * s);
      og.fillCircle(p.x, p.y, 2.5 * s);
    }
  }
  if (activeGenes.has("FLAGELLUM")) {
    og.lineStyle(1.5, GENES.FLAGELLUM.color, 0.5 * alpha);
    const a2 = rot(0, -30 * s),
      b2 = rot(0, 30 * s);
    og.lineBetween(a2.x, a2.y, b2.x, b2.y);
  }
  if (activeGenes.has("MEMBRANE")) {
    og.lineStyle(2.5, GENES.MEMBRANE.color, 0.22 * alpha);
    const segs = 24;
    for (let i = 0; i < segs; i++) {
      const a1 = (i / segs) * Math.PI * 2,
        a2 = ((i + 1) / segs) * Math.PI * 2;
      const p1 = rot(Math.cos(a1) * 26 * s, Math.sin(a1) * 66 * s);
      const p2 = rot(Math.cos(a2) * 26 * s, Math.sin(a2) * 66 * s);
      og.lineBetween(p1.x, p1.y, p2.x, p2.y);
    }
  }
  if (activeGenes.has("TOXIN")) {
    og.lineStyle(1.5, GENES.TOXIN.color, 0.68 * alpha);
    [
      [7, 0],
      [-7, 18],
      [7, -18],
    ].forEach(([x, y]) => {
      const p = rot(x * s, y * s);
      og.strokeCircle(p.x, p.y, 4.5 * s);
    });
  }
}

function drawPseudopods(g, state) {
  for (let i = 0; i < 3; i++) {
    const ba =
      Math.atan2(state.player.y - state.predator.y, state.player.x - state.predator.x) + (i - 1) * 0.4;
    const len = 52 + Math.sin(state.flagPhase * 2 + i) * 14;
    const perpX = Math.cos(ba + Math.PI / 2),
      perpY = Math.sin(ba + Math.PI / 2);
    g.lineStyle(2.5, PAL.predator.outer, 0.6);
    g.beginPath();
    g.moveTo(state.predator.x + Math.cos(ba) * 60, state.predator.y + Math.sin(ba) * 48);
    for (let s = 1; s <= 14; s++) {
      const t = s / 14;
      const cx2 = state.predator.x + Math.cos(ba) * (60 + len * t);
      const cy2 = state.predator.y + Math.sin(ba) * (48 + len * t);
      const w = Math.sin(state.flagPhase * 1.5 + i * 2 + t * Math.PI * 2) * 4;
      g.lineTo(cx2 + perpX * w, cy2 + perpY * w);
    }
    g.strokePath();
  }
}

function drawBackground(g) {
  // Base fill — dark navy
  g.fillStyle(0x07071a, 1.0);
  g.fillRect(0, 0, WORLD_W, WORLD_H);

  // Very faint hex-grid overlay (suggests microscope slide)
  g.lineStyle(0.5, 0x1a1a3a, 0.1);
  const gs = 120;
  for (let x = 0; x < WORLD_W; x += gs) {
    g.lineBetween(x, 0, x, WORLD_H);
  }
  for (let y = 0; y < WORLD_H; y += gs) {
    g.lineBetween(0, y, WORLD_W, y);
  }

  // Ghost bacteria — suggest a densely populated background community
  const ghostPals = [PAL.npc0, PAL.npc1, PAL.npc2, PAL.npc3, PAL.player];
  for (let i = 0; i < 120; i++) {
    const x = Phaser.Math.Between(0, WORLD_W);
    const y = Phaser.Math.Between(0, WORLD_H);
    const ang = Math.random() * Math.PI * 2;
    const s = 0.4 + Math.random() * 0.5;
    const pal = ghostPals[i % 5];
    drawBacteriaSimple(g, x, y, ang, 10 * s, 36 * s, pal.outer, 0.25 + Math.random() * 0.2);
  }

  // Small cocci clusters
  for (let i = 0; i < 80; i++) {
    const cx = Phaser.Math.Between(0, WORLD_W),
      cy = Phaser.Math.Between(0, WORLD_H);
    const pal = ghostPals[i % 5];
    g.fillStyle(pal.outer, 0.12 + Math.random() * 0.1);
    g.fillCircle(cx, cy, 3 + Math.random() * 5);
    g.lineStyle(0.8, pal.outer, 0.25);
    g.strokeCircle(cx, cy, 3 + Math.random() * 5);
  }

  // Bioluminescent glow patches — scattered soft blooms
  const glowCols = [0x00e8d0, 0xff44bb, 0xaa55ff, 0x55ff88, 0xffd060, 0x4488ff];
  for (let i = 0; i < 40; i++) {
    const x = Phaser.Math.Between(100, WORLD_W - 100);
    const y = Phaser.Math.Between(100, WORLD_H - 100);
    const r = 45 + Math.random() * 120;
    const c = glowCols[i % 6];
    g.lineStyle(r * 0.9, c, 0.008 + Math.random() * 0.006);
    g.strokeCircle(x, y, r * 0.25);
  }

  // Faint radial orientation markers
  g.lineStyle(0.5, 0x1a1a40, 0.22);
  for (let r = 400; r < 1600; r += 400) {
    g.strokeCircle(WORLD_W / 2, WORLD_H / 2, r);
  }
}
