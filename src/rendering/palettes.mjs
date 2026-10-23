import { GENES } from "../config.mjs";

export const PAL = {
  player: {
    outer: 0xffd060,
    og: 0xffee99,
    peri: 0x7a4000,
    cyto: 0x180c00,
    inner: 0xcc9900,
    nuc: 0xff9900,
    ribo: 0xffe888,
    gran: [
      [-0.22, -0.38, 2.4, 0xff5500],
      [0.18, 0.32, 1.9, 0xffbb00],
      [0.0, -0.18, 1.5, 0xff8800],
    ],
  },
  npc0: {
    // cyan/teal
    outer: 0x00e8d0,
    og: 0x88ffee,
    peri: 0x004444,
    cyto: 0x001616,
    inner: 0x00bbaa,
    nuc: 0x00ffcc,
    ribo: 0xaaffee,
    gran: [
      [-0.2, -0.3, 2.1, 0xff8800],
      [0.2, 0.25, 1.7, 0x00ffff],
    ],
  },
  npc1: {
    // rose/magenta
    outer: 0xff44bb,
    og: 0xff99dd,
    peri: 0x660033,
    cyto: 0x1e000e,
    inner: 0xcc3388,
    nuc: 0xff66cc,
    ribo: 0xffccee,
    gran: [
      [-0.15, -0.32, 2.2, 0xff2244],
      [0.2, 0.22, 1.8, 0xffaa00],
    ],
  },
  npc2: {
    // lime/green
    outer: 0x55ff88,
    og: 0xaaffcc,
    peri: 0x004422,
    cyto: 0x001308,
    inner: 0x33dd66,
    nuc: 0x88ffaa,
    ribo: 0xccffdd,
    gran: [
      [-0.18, -0.28, 2.0, 0xffee00],
      [0.22, 0.2, 1.6, 0x00ffaa],
    ],
  },
  npc3: {
    // violet/purple
    outer: 0xaa55ff,
    og: 0xcc99ff,
    peri: 0x330055,
    cyto: 0x0e001c,
    inner: 0x8833ee,
    nuc: 0xcc88ff,
    ribo: 0xeeccff,
    gran: [
      [-0.2, -0.3, 2.1, 0xff44ff],
      [0.18, 0.28, 1.7, 0x4488ff],
    ],
  },
  daughter: {
    outer: 0x88ffee,
    og: 0xccffff,
    peri: 0x003344,
    cyto: 0x001018,
    inner: 0x55ddcc,
    nuc: 0xaaffee,
    ribo: 0xddfff8,
    gran: [
      [-0.18, -0.3, 1.9, 0x00ffcc],
      [0.2, 0.22, 1.6, 0x88aaff],
    ],
  },
  predator: {
    outer: 0xff2200,
    og: 0xff8866,
    peri: 0x440000,
    cyto: 0x180000,
    inner: 0xcc2200,
    nuc: 0xff6600,
    ribo: 0xff9966,
    gran: [],
  },
};
export const NPC_PALS = [PAL.npc0, PAL.npc1, PAL.npc2, PAL.npc3];

export function getPlayerPalette(activeGenes) {
  if (activeGenes.size === 0) return PAL.player;
  let r = (PAL.player.outer >> 16) & 0xff;
  let gr = (PAL.player.outer >> 8) & 0xff;
  let b = PAL.player.outer & 0xff;
  activeGenes.forEach((key) => {
    const c = GENES[key].color;
    r = Math.min(255, r + ((c >> 16) & 0xff) * 0.28) | 0;
    gr = Math.min(255, gr + ((c >> 8) & 0xff) * 0.28) | 0;
    b = Math.min(255, b + (c & 0xff) * 0.28) | 0;
  });
  const blended = (r << 16) | (gr << 8) | b;
  return Object.assign({}, PAL.player, { outer: blended });
}
