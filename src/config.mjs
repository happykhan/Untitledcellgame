export const WORLD_W = 3200;
export const WORLD_H = 3200;

export const GENES = {
  HSP: {
    color: 0xff4400,
    symbol: "H",
    desc: "Heat tolerance",
    effect: "Halves heat-stress energy cost",
    short: "½ heat cost",
  },
  CSP: {
    color: 0x4488ff,
    symbol: "C",
    desc: "Cold tolerance",
    effect: "Halves cold-stress energy cost",
    short: "½ cold cost",
  },
  FLAGELLUM: {
    color: 0xccff00,
    symbol: "F",
    desc: "Motility",
    effect: "40% faster swimming; costs extra energy",
    short: "+40% swim",
  },
  MEMBRANE: {
    color: 0xff8800,
    symbol: "M",
    desc: "Protection",
    effect: "More time to escape predation; 15% slower",
    short: "Escape time↑",
  },
  TOXIN: {
    color: 0xcc44ff,
    symbol: "T",
    desc: "Bacteriocin",
    effect: "50% wider defence burst",
    short: "+50% range",
  },
};
export const GENE_KEYS = Object.keys(GENES);

export function getViewportSettings(width, height) {
  const minDim = Math.min(width, height);
  return {
    cellScale: Math.max(0.5, Math.min(1.1, minDim / 500)),
    zoom: Math.max(0.42, Math.min(0.78, minDim / 550)),
    detail: minDim >= 460,
  };
}
