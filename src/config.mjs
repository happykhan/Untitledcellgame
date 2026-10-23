export const WORLD_W = 3200;
export const WORLD_H = 3200;

export const GENES = {
  HSP: { color: 0xff4400, symbol: "H", desc: "heat resist" },
  CSP: { color: 0x4488ff, symbol: "C", desc: "cold resist" },
  FLAGELLUM: { color: 0xccff00, symbol: "F", desc: "+speed" },
  MEMBRANE: { color: 0xff8800, symbol: "M", desc: "+defense" },
  TOXIN: { color: 0xcc44ff, symbol: "T", desc: "+bact range" },
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
