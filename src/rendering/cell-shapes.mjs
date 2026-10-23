import { PAL } from "./palettes.mjs";

// Rotated ellipse path (used for nucleoid and round inner structures)
export function ellipsePath(g, cx, cy, rx, ry, cos, sin, segs) {
  segs = segs || 28;
  g.beginPath();
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    const ex = Math.cos(a) * rx,
      ey = Math.sin(a) * ry;
    const wx = cx + ex * cos - ey * sin,
      wy = cy + ex * sin + ey * cos;
    i === 0 ? g.moveTo(wx, wy) : g.lineTo(wx, wy);
  }
  g.closePath();
}

// Triangle-fan fill for a rotated ellipse
export function fillEllipse(g, cx, cy, rx, ry, cos, sin, segs) {
  segs = segs || 24;
  for (let i = 0; i < segs; i++) {
    const a1 = (i / segs) * Math.PI * 2,
      a2 = ((i + 1) / segs) * Math.PI * 2;
    g.fillTriangle(
      cx,
      cy,
      cx + Math.cos(a1) * rx * cos - Math.sin(a1) * ry * sin,
      cy + Math.cos(a1) * rx * sin + Math.sin(a1) * ry * cos,
      cx + Math.cos(a2) * rx * cos - Math.sin(a2) * ry * sin,
      cy + Math.cos(a2) * rx * sin + Math.sin(a2) * ry * cos,
    );
  }
}

// Capsule (stadium) path — proper rod bacterium shape.
// Major axis along local Y. h = ry - rx is the straight-side half-length.
// Traces: top semicircle (angles π→2π) + right-side lineTo + bottom semicircle (0→π) + closePath (left side).
export function capsulePath(g, cx, cy, rx, ry, cos, sin, segs) {
  segs = segs || 14;
  const h = Math.max(0, ry - rx);
  const W = (lx, ly) => [cx + lx * cos - ly * sin, cy + lx * sin + ly * cos];
  g.beginPath();
  // Top cap
  for (let i = 0; i <= segs; i++) {
    const a = Math.PI + (i / segs) * Math.PI;
    const [wx, wy] = W(Math.cos(a) * rx, -h + Math.sin(a) * rx);
    i === 0 ? g.moveTo(wx, wy) : g.lineTo(wx, wy);
  }
  // Bottom cap (lineTo first point continues the right straight side automatically)
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI;
    const [wx, wy] = W(Math.cos(a) * rx, h + Math.sin(a) * rx);
    g.lineTo(wx, wy);
  }
  g.closePath(); // closes left straight side
}

// Triangle-fan fill for capsule
export function fillCapsule(g, cx, cy, rx, ry, cos, sin, segs) {
  segs = segs || 14;
  const h = Math.max(0, ry - rx);
  const vx = [],
    vy = [];
  for (let i = 0; i <= segs; i++) {
    const a = Math.PI + (i / segs) * Math.PI;
    vx.push(cx + Math.cos(a) * rx * cos - (-h + Math.sin(a) * rx) * sin);
    vy.push(cy + Math.cos(a) * rx * sin + (-h + Math.sin(a) * rx) * cos);
  }
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI;
    vx.push(cx + Math.cos(a) * rx * cos - (h + Math.sin(a) * rx) * sin);
    vy.push(cy + Math.cos(a) * rx * sin + (h + Math.sin(a) * rx) * cos);
  }
  const n = vx.length;
  for (let i = 0; i < n - 1; i++) {
    g.fillTriangle(cx, cy, vx[i], vy[i], vx[i + 1], vy[i + 1]);
  }
  g.fillTriangle(cx, cy, vx[n - 1], vy[n - 1], vx[0], vy[0]);
}

// Capsule path with subtle organic membrane wobble
export function capsulePathWobble(g, cx, cy, rx, ry, cos, sin, phase, amp) {
  const segs = 20,
    h = Math.max(0, ry - rx);
  g.beginPath();
  let first = true;
  const pt = (a, ly0) => {
    const w = 1 + (Math.sin(a * 2.5 + phase) * amp) / (rx + 1);
    const lx = Math.cos(a) * rx * w,
      ly = ly0 + Math.sin(a) * rx * w;
    const wx = cx + lx * cos - ly * sin,
      wy = cy + lx * sin + ly * cos;
    first ? (g.moveTo(wx, wy), (first = false)) : g.lineTo(wx, wy);
  };
  for (let i = 0; i <= segs; i++) pt(Math.PI + (i / segs) * Math.PI, -h);
  for (let i = 0; i <= segs; i++) pt((i / segs) * Math.PI, h);
  g.closePath();
}

// Full ornate gram-negative rod — fluid and ethereal rendering
// phase: animation phase for membrane wobble (pass cell's flagPhase)
export function drawBacteria(g, cx, cy, angle, rx, ry, pal, alpha, phase, detail = true) {
  phase = phase || 0;
  const cos = Math.cos(angle),
    sin = Math.sin(angle);
  const a = alpha;

  // Layered soft glow — 4 concentric diffuse halos build up from outside in
  g.lineStyle(rx * 5, pal.outer, 0.018 * a);
  capsulePath(g, cx, cy, rx + 5, ry + 5, cos, sin);
  g.strokePath();
  g.lineStyle(rx * 3.5, pal.outer, 0.03 * a);
  capsulePath(g, cx, cy, rx + 3, ry + 3, cos, sin);
  g.strokePath();
  g.lineStyle(rx * 2, pal.og, 0.055 * a);
  capsulePath(g, cx, cy, rx + 1.5, ry + 1.5, cos, sin);
  g.strokePath();
  g.lineStyle(rx * 1, pal.og, 0.1 * a);
  capsulePath(g, cx, cy, rx + 0.5, ry + 0.5, cos, sin);
  g.strokePath();

  // Periplasm — translucent
  g.fillStyle(pal.peri, 0.45 * a);
  fillCapsule(g, cx, cy, rx, ry, cos, sin);

  // Cytoplasm — semi-transparent
  g.fillStyle(pal.cyto, 0.8 * a);
  fillCapsule(g, cx, cy, rx * 0.73, ry * 0.73, cos, sin);

  // Nucleoid — soft luminous double-glow (no hard line)
  g.fillStyle(pal.nuc, 0.18 * a);
  fillEllipse(g, cx, cy, rx * 0.62, ry * 0.32, cos, sin);
  g.fillStyle(pal.nuc, 0.42 * a);
  fillEllipse(g, cx, cy, rx * 0.38, ry * 0.2, cos, sin);

  if (detail) {
    // Ribosomes — subtle soft dots
    g.fillStyle(pal.ribo, 0.45 * a);
    for (let i = 0; i < 10; i++) {
      const t = (i / 10) * Math.PI * 2;
      const lx = Math.cos(t + phase * 0.06) * rx * 0.48,
        ly = Math.sin(t + phase * 0.04) * ry * 0.5;
      g.fillCircle(cx + lx * cos - ly * sin, cy + lx * sin + ly * cos, 1.1);
    }
  }

  // Inclusion granules — soft glow, no hard outline
  pal.gran.forEach(function (gr) {
    const lx = gr[0] * rx + Math.sin(phase * 0.13 + gr[2]) * rx * 0.12;
    const ly = gr[1] * ry + Math.cos(phase * 0.09 + gr[2]) * ry * 0.06;
    const wx = cx + lx * cos - ly * sin;
    const wy = cy + lx * sin + ly * cos;
    g.fillStyle(gr[3], 0.35 * a);
    g.fillCircle(wx, wy, gr[2] * 1.8);
    g.fillStyle(gr[3], 0.75 * a);
    g.fillCircle(wx, wy, gr[2] * 0.8);
  });

  // Inner membrane — soft, glowing
  g.lineStyle(1.2, pal.inner, 0.32 * a);
  capsulePath(g, cx, cy, rx * 0.73, ry * 0.73, cos, sin);
  g.strokePath();

  // Outer membrane — organic wobble, luminous
  g.lineStyle(1.6, pal.outer, 0.75 * a);
  capsulePathWobble(g, cx, cy, rx, ry, cos, sin, phase, 0.7);
  g.strokePath();

  // Crisp inner edge of membrane (double-membrane suggestion)
  g.lineStyle(0.6, pal.og, 0.4 * a);
  capsulePathWobble(g, cx, cy, rx * 0.93, ry * 0.93, cos, sin, phase + 0.3, 0.4);
  g.strokePath();
}

// Division keeps a continuous membrane until the final pinch closes.
export function drawDividingCell(g, cx, cy, angle, scale, progress, pal) {
  const rx = 9 * scale,
    ry = (62 + 28 * progress) * scale;
  const cos = Math.cos(angle),
    sin = Math.sin(angle);
  const path = (inset = 1) => {
    g.beginPath();
    for (let side = 0; side < 2; side++) {
      for (let i = 0; i <= 64; i++) {
        const y = (-ry + (2 * ry * i) / 64) * (side ? -1 : 1);
        const cap = Math.max(0, Math.abs(y) - (ry - rx));
        const width = Math.sqrt(Math.max(0, rx * rx - cap * cap));
        const pinch = 1 - 0.98 * progress * Math.exp(-Math.pow(y / (16 * scale), 2));
        const x = width * pinch * inset * (side ? -1 : 1);
        const wx = cx + x * cos - y * sin,
          wy = cy + x * sin + y * cos;
        if (!side && !i) g.moveTo(wx, wy);
        else g.lineTo(wx, wy);
      }
    }
    g.closePath();
  };
  g.fillStyle(pal.cyto, 0.95);
  path();
  g.fillPath();
  g.lineStyle(7 * scale, pal.outer, 0.08);
  path();
  g.strokePath();
  g.lineStyle(1.8, pal.outer, 0.95);
  path();
  g.strokePath();
  g.lineStyle(0.8, pal.inner, 0.65);
  path(0.7);
  g.strokePath();
  for (const direction of [-1, 1]) {
    const offset = direction * (10 + 33 * progress) * scale;
    const x = cx - Math.sin(angle) * offset,
      y = cy + Math.cos(angle) * offset;
    g.fillStyle(pal.nuc, 0.5);
    fillEllipse(g, x, y, rx * 0.48, 12 * scale, cos, sin);
  }
}

// Coccus — spherical bacterium (Staphylococcus, Streptococcus style)
export function drawCoccus(g, cx, cy, r, pal, alpha, phase, detail = true) {
  const a = alpha;
  // Layered soft glow
  g.lineStyle(r * 4, pal.outer, 0.022 * a);
  g.strokeCircle(cx, cy, r);
  g.lineStyle(r * 2.2, pal.outer, 0.04 * a);
  g.strokeCircle(cx, cy, r);
  g.lineStyle(r * 0.9, pal.og, 0.09 * a);
  g.strokeCircle(cx, cy, r);
  // Periplasm, cytoplasm, nucleoid
  g.fillStyle(pal.peri, 0.45 * a);
  g.fillCircle(cx, cy, r);
  g.fillStyle(pal.cyto, 0.82 * a);
  g.fillCircle(cx, cy, r * 0.76);
  g.fillStyle(pal.nuc, 0.18 * a);
  g.fillCircle(cx, cy, r * 0.5);
  g.fillStyle(pal.nuc, 0.42 * a);
  g.fillCircle(cx, cy, r * 0.28);
  // Granules
  pal.gran.forEach(function (gr) {
    const wx = cx + gr[0] * r,
      wy = cy + gr[1] * r;
    g.fillStyle(gr[3], 0.35 * a);
    g.fillCircle(wx, wy, gr[2] * 1.5);
    g.fillStyle(gr[3], 0.75 * a);
    g.fillCircle(wx, wy, gr[2] * 0.65);
  });
  if (detail) {
    g.fillStyle(pal.ribo, 0.42 * a);
    for (let i = 0; i < 7; i++) {
      const t = (i / 7) * Math.PI * 2;
      g.fillCircle(cx + Math.cos(t) * r * 0.52, cy + Math.sin(t) * r * 0.52, 1.0);
    }
  }
  // Membrane + halo
  g.lineStyle(1.6, pal.outer, 0.78 * a);
  g.strokeCircle(cx, cy, r);
  g.lineStyle(0.7, pal.og, 0.38 * a);
  g.strokeCircle(cx, cy, r * 0.92);
}

// Vibrio — comma-shaped curved rod (Vibrio cholerae style)
// Rendered as a thick curved arc with layered membrane detail
export function drawVibrio(g, cx, cy, angle, rx, ry, pal, alpha, phase, detail = true) {
  const a = alpha;
  const segs = 18;
  const sweep = 0.55; // arc bend (radians ≈ 31°)
  const R = ry / sweep; // radius of curvature
  // Arc centre sits perpendicular to the cell's orientation
  const acx = cx + Math.sin(angle) * R;
  const acy = cy - Math.cos(angle) * R;
  const midA = Math.atan2(cy - acy, cx - acx);
  const a0 = midA - sweep / 2,
    a1 = midA + sweep / 2;

  const arc = (radius, lw, col, la) => {
    g.lineStyle(lw, col, la * a);
    g.beginPath();
    for (let i = 0; i <= segs; i++) {
      const t = a0 + (i / segs) * (a1 - a0);
      const wb = 1 + (Math.sin(t * 3 + phase) * 0.55) / (radius + 1);
      i === 0
        ? g.moveTo(acx + Math.cos(t) * radius * wb, acy + Math.sin(t) * radius * wb)
        : g.lineTo(acx + Math.cos(t) * radius * wb, acy + Math.sin(t) * radius * wb);
    }
    g.strokePath();
  };

  arc(R, rx * 5, pal.outer, 0.022);
  arc(R, rx * 3.5, pal.outer, 0.038);
  arc(R, rx * 2.2, pal.peri, 0.68);
  arc(R, rx * 1.4, pal.cyto, 0.9);
  arc(R, rx * 0.45, pal.nuc, 0.38);
  arc(R + rx, 1.5, pal.outer, 0.78);
  arc(R - rx, 1.1, pal.outer, 0.55);
  arc(R + rx * 0.3, rx * 0.7, pal.og, 0.14);

  // Rounded end caps
  [a0, a1].forEach((ta) => {
    const ecx = acx + Math.cos(ta) * R,
      ecy = acy + Math.sin(ta) * R;
    g.fillStyle(pal.peri, 0.55 * a);
    g.fillCircle(ecx, ecy, rx * 0.85);
    g.fillStyle(pal.cyto, 0.88 * a);
    g.fillCircle(ecx, ecy, rx * 0.6);
    g.lineStyle(1.4, pal.outer, 0.8 * a);
    g.strokeCircle(ecx, ecy, rx * 0.85);
  });
}

// Simplified rod — for background ghost cells (fast, capsule shape)
export function drawBacteriaSimple(g, cx, cy, angle, rx, ry, col, alpha) {
  const cos = Math.cos(angle),
    sin = Math.sin(angle);
  g.lineStyle(rx * 2.5, col, 0.04 * alpha);
  capsulePath(g, cx, cy, rx, ry, cos, sin);
  g.strokePath();
  g.fillStyle(col, 0.08 * alpha);
  fillCapsule(g, cx, cy, rx, ry, cos, sin);
  g.lineStyle(1.2, col, 0.3 * alpha);
  capsulePath(g, cx, cy, rx, ry, cos, sin);
  g.strokePath();
}

// Eukaryotic predator with full organelle detail
export function drawPredator(g, cx, cy, rx, ry, alpha, phase) {
  const pal = PAL.predator;
  const a = alpha;

  // Bloom
  g.lineStyle(rx * 2.5, pal.outer, 0.04 * a);
  g.strokeEllipse(cx, cy, rx * 2, ry * 2);

  // Cytoplasm
  g.fillStyle(pal.cyto, 0.9 * a);
  g.fillEllipse(cx, cy, rx * 2, ry * 2);

  // ER-like interior reticulum
  g.lineStyle(0.9, pal.inner, 0.28 * a);
  for (let i = 0; i < 4; i++) {
    const t0 = (i / 4) * Math.PI * 2;
    g.lineBetween(
      cx + Math.cos(t0) * rx * 0.6,
      cy + Math.sin(t0) * ry * 0.55,
      cx + Math.cos(t0 + 1) * rx * 0.5,
      cy + Math.sin(t0 + 1) * ry * 0.45,
    );
  }

  // Vacuoles
  [
    [0.3, 0.2, 0.14],
    [-0.3, -0.2, 0.11],
    [0.0, 0.34, 0.09],
  ].forEach(function (v) {
    g.fillStyle(0x0a0000, 0.65 * a);
    g.fillCircle(cx + v[0] * rx, cy + v[1] * ry, v[2] * rx);
    g.lineStyle(0.8, pal.inner, 0.5 * a);
    g.strokeCircle(cx + v[0] * rx, cy + v[1] * ry, v[2] * rx);
  });

  // Mitochondria — small rotated blobs
  [
    [0.15, -0.3, 0],
    [-0.2, 0.15, 1.1],
    [0.3, -0.15, 2.2],
  ].forEach(function (m) {
    const mc = Math.cos(m[2]),
      ms = Math.sin(m[2]);
    g.fillStyle(pal.nuc, 0.4 * a);
    fillEllipse(g, cx + m[0] * rx, cy + m[1] * ry, rx * 0.11, ry * 0.07, mc, ms);
    g.lineStyle(0.7, pal.nuc, 0.65 * a);
    ellipsePath(g, cx + m[0] * rx, cy + m[1] * ry, rx * 0.11, ry * 0.07, mc, ms);
    g.strokePath();
  });

  // Nucleus with double envelope
  g.fillStyle(0x330000, 0.85 * a);
  g.fillCircle(cx, cy, rx * 0.3);
  g.fillStyle(pal.nuc, 0.5 * a);
  g.fillCircle(cx, cy, rx * 0.2);
  g.lineStyle(1.8, pal.nuc, 0.8 * a);
  g.strokeCircle(cx, cy, rx * 0.3);
  // Nucleolus
  g.fillStyle(0xff4400, 0.7 * a);
  g.fillCircle(cx + rx * 0.08, cy - ry * 0.06, rx * 0.09);

  // Outer membrane
  g.lineStyle(2.5, pal.outer, alpha);
  g.strokeEllipse(cx, cy, rx * 2, ry * 2);
  g.lineStyle(4, pal.og, 0.2 * a);
  g.strokeEllipse(cx, cy, rx * 2 + 3, ry * 2 + 3);
}
