// ============================================================
//  Untitled Cell Game v4  —  Ornate jeweled microscopy aesthetic
// ============================================================

const WORLD_W = 3200;
const WORLD_H = 3200;

const _minDim = Math.min(window.innerWidth, window.innerHeight);
const CELL_S  = Math.max(0.5, Math.min(1.1, _minDim / 500));
const ZOOM    = Math.max(0.42, Math.min(0.78, _minDim / 550));
const DETAIL  = _minDim >= 460;  // ribosomes + LPS fuzz on larger screens only

const GENES = {
  HSP:      { color: 0xff4400, symbol: 'H', desc: 'heat resist' },
  CSP:      { color: 0x4488ff, symbol: 'C', desc: 'cold resist' },
  FLAGELLUM:{ color: 0xccff00, symbol: 'F', desc: '+speed'      },
  MEMBRANE: { color: 0xff8800, symbol: 'M', desc: '+defense'    },
  TOXIN:    { color: 0xcc44ff, symbol: 'T', desc: '+bact range' },
};
const GENE_KEYS = Object.keys(GENES);

// ── Jeweled microscopy palettes ───────────────────────────
// outer=membrane, og=outer glow, peri=periplasm, cyto=cytoplasm,
// inner=inner membrane, nuc=nucleoid, ribo=ribosomes,
// gran=[[unit_x, unit_y, radius, color], ...] inclusion bodies
const PAL = {
  player: {
    outer:0xffd060, og:0xffee99, peri:0x7a4000, cyto:0x180c00,
    inner:0xcc9900, nuc:0xff9900, ribo:0xffe888,
    gran:[[-0.22,-0.38,2.4,0xff5500],[0.18,0.32,1.9,0xffbb00],[0.0,-0.18,1.5,0xff8800]],
  },
  npc0: { // cyan/teal
    outer:0x00e8d0, og:0x88ffee, peri:0x004444, cyto:0x001616,
    inner:0x00bbaa, nuc:0x00ffcc, ribo:0xaaffee,
    gran:[[-0.2,-0.3,2.1,0xff8800],[0.2,0.25,1.7,0x00ffff]],
  },
  npc1: { // rose/magenta
    outer:0xff44bb, og:0xff99dd, peri:0x660033, cyto:0x1e000e,
    inner:0xcc3388, nuc:0xff66cc, ribo:0xffccee,
    gran:[[-0.15,-0.32,2.2,0xff2244],[0.2,0.22,1.8,0xffaa00]],
  },
  npc2: { // lime/green
    outer:0x55ff88, og:0xaaffcc, peri:0x004422, cyto:0x001308,
    inner:0x33dd66, nuc:0x88ffaa, ribo:0xccffdd,
    gran:[[-0.18,-0.28,2.0,0xffee00],[0.22,0.2,1.6,0x00ffaa]],
  },
  npc3: { // violet/purple
    outer:0xaa55ff, og:0xcc99ff, peri:0x330055, cyto:0x0e001c,
    inner:0x8833ee, nuc:0xcc88ff, ribo:0xeeccff,
    gran:[[-0.2,-0.3,2.1,0xff44ff],[0.18,0.28,1.7,0x4488ff]],
  },
  daughter: {
    outer:0x88ffee, og:0xccffff, peri:0x003344, cyto:0x001018,
    inner:0x55ddcc, nuc:0xaaffee, ribo:0xddfff8,
    gran:[[-0.18,-0.3,1.9,0x00ffcc],[0.2,0.22,1.6,0x88aaff]],
  },
  predator: {
    outer:0xff2200, og:0xff8866, peri:0x440000, cyto:0x180000,
    inner:0xcc2200, nuc:0xff6600, ribo:0xff9966, gran:[],
  },
};
const NPC_PALS = [PAL.npc0, PAL.npc1, PAL.npc2, PAL.npc3];

// ── Graphics helpers ──────────────────────────────────────

function ellipsePath(g, cx, cy, rx, ry, cos, sin, segs) {
  segs = segs || 30;
  g.beginPath();
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    const ex = Math.cos(a) * rx, ey = Math.sin(a) * ry;
    const wx = cx + ex * cos - ey * sin, wy = cy + ex * sin + ey * cos;
    i === 0 ? g.moveTo(wx, wy) : g.lineTo(wx, wy);
  }
  g.closePath();
}

function fillEllipse(g, cx, cy, rx, ry, cos, sin, segs) {
  segs = segs || 28;
  for (let i = 0; i < segs; i++) {
    const a1 = (i / segs) * Math.PI * 2, a2 = ((i + 1) / segs) * Math.PI * 2;
    g.fillTriangle(
      cx, cy,
      cx + Math.cos(a1)*rx*cos - Math.sin(a1)*ry*sin,
      cy + Math.cos(a1)*rx*sin + Math.sin(a1)*ry*cos,
      cx + Math.cos(a2)*rx*cos - Math.sin(a2)*ry*sin,
      cy + Math.cos(a2)*rx*sin + Math.sin(a2)*ry*cos
    );
  }
}

// Full ornate gram-negative bacterium
function drawBacteria(g, cx, cy, angle, rx, ry, pal, alpha) {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const a = alpha;

  // Outer bloom glow
  g.lineStyle(rx * 3.5, pal.outer, 0.06 * a);
  ellipsePath(g, cx, cy, rx + 1, ry + 1, cos, sin); g.strokePath();

  // Periplasmic space fill
  g.fillStyle(pal.peri, 0.72 * a);
  fillEllipse(g, cx, cy, rx, ry, cos, sin);

  // Cytoplasm fill
  g.fillStyle(pal.cyto, 0.93 * a);
  fillEllipse(g, cx, cy, rx * 0.73, ry * 0.73, cos, sin);

  // Nucleoid blob
  g.fillStyle(pal.nuc, 0.36 * a);
  fillEllipse(g, cx, cy, rx * 0.42, ry * 0.30, cos, sin);
  g.lineStyle(0.9, pal.nuc, 0.6 * a);
  ellipsePath(g, cx, cy, rx * 0.42, ry * 0.30, cos, sin); g.strokePath();

  if (DETAIL) {
    // Ribosomes — ring of tiny dots
    g.fillStyle(pal.ribo, 0.78 * a);
    for (let i = 0; i < 10; i++) {
      const t = (i / 10) * Math.PI * 2;
      const lx = Math.cos(t) * rx * 0.55, ly = Math.sin(t) * ry * 0.52;
      g.fillCircle(cx + lx * cos - ly * sin, cy + lx * sin + ly * cos, 1.1);
    }
  }

  // Inclusion granules (bright spots with outline)
  pal.gran.forEach(function(gr) {
    const wx = cx + (gr[0] * rx) * cos - (gr[1] * ry) * sin;
    const wy = cy + (gr[0] * rx) * sin + (gr[1] * ry) * cos;
    g.fillStyle(gr[3], 0.82 * a);   g.fillCircle(wx, wy, gr[2]);
    g.lineStyle(0.7, gr[3], alpha); g.strokeCircle(wx, wy, gr[2]);
  });

  // Inner (cytoplasmic) membrane
  g.lineStyle(1.1, pal.inner, 0.62 * a);
  ellipsePath(g, cx, cy, rx * 0.73, ry * 0.73, cos, sin); g.strokePath();

  // Outer membrane — crisp bright
  g.lineStyle(2.0, pal.outer, alpha);
  ellipsePath(g, cx, cy, rx, ry, cos, sin); g.strokePath();

  // Outer halo
  g.lineStyle(3.5, pal.og, 0.24 * a);
  ellipsePath(g, cx, cy, rx + 1.2, ry + 1.2, cos, sin); g.strokePath();

  if (DETAIL) {
    // LPS surface fuzz — tiny radial stubs
    g.lineStyle(0.8, pal.outer, 0.36 * a);
    for (let i = 0; i < 14; i++) {
      const t = (i / 14) * Math.PI * 2;
      const ex1 = Math.cos(t) * rx, ey1 = Math.sin(t) * ry;
      const ex2 = Math.cos(t) * (rx + 3), ey2 = Math.sin(t) * (ry + 3);
      g.lineBetween(
        cx + ex1*cos - ey1*sin, cy + ex1*sin + ey1*cos,
        cx + ex2*cos - ey2*sin, cy + ex2*sin + ey2*cos
      );
    }
  }
}

// Quick simplified bacterium — for background ghost cells
function drawBacteriaSimple(g, cx, cy, angle, rx, ry, col, alpha) {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  g.lineStyle(rx * 2.5, col, 0.04 * alpha);
  ellipsePath(g, cx, cy, rx, ry, cos, sin); g.strokePath();
  g.fillStyle(col, 0.08 * alpha);
  fillEllipse(g, cx, cy, rx, ry, cos, sin);
  g.lineStyle(1.2, col, 0.3 * alpha);
  ellipsePath(g, cx, cy, rx, ry, cos, sin); g.strokePath();
}

// Eukaryotic predator with full organelle detail
function drawPredator(g, cx, cy, rx, ry, alpha, phase) {
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
      cx + Math.cos(t0) * rx * 0.6, cy + Math.sin(t0) * ry * 0.55,
      cx + Math.cos(t0 + 1) * rx * 0.5, cy + Math.sin(t0 + 1) * ry * 0.45
    );
  }

  // Vacuoles
  [[0.3, 0.2, 0.14], [-0.3, -0.2, 0.11], [0.0, 0.34, 0.09]].forEach(function(v) {
    g.fillStyle(0x0a0000, 0.65 * a); g.fillCircle(cx + v[0]*rx, cy + v[1]*ry, v[2]*rx);
    g.lineStyle(0.8, pal.inner, 0.5 * a); g.strokeCircle(cx + v[0]*rx, cy + v[1]*ry, v[2]*rx);
  });

  // Mitochondria — small rotated blobs
  [[0.15, -0.3, 0], [-0.2, 0.15, 1.1], [0.3, -0.15, 2.2]].forEach(function(m) {
    const mc = Math.cos(m[2]), ms = Math.sin(m[2]);
    g.fillStyle(pal.nuc, 0.4 * a);
    fillEllipse(g, cx + m[0]*rx, cy + m[1]*ry, rx*0.11, ry*0.07, mc, ms);
    g.lineStyle(0.7, pal.nuc, 0.65 * a);
    ellipsePath(g, cx + m[0]*rx, cy + m[1]*ry, rx*0.11, ry*0.07, mc, ms); g.strokePath();
  });

  // Nucleus with double envelope
  g.fillStyle(0x330000, 0.85 * a); g.fillCircle(cx, cy, rx * 0.3);
  g.fillStyle(pal.nuc, 0.5 * a);   g.fillCircle(cx, cy, rx * 0.2);
  g.lineStyle(1.8, pal.nuc, 0.8 * a); g.strokeCircle(cx, cy, rx * 0.3);
  // Nucleolus
  g.fillStyle(0xff4400, 0.7 * a);
  g.fillCircle(cx + rx * 0.08, cy - ry * 0.06, rx * 0.09);

  // Outer membrane
  g.lineStyle(2.5, pal.outer, alpha); g.strokeEllipse(cx, cy, rx * 2, ry * 2);
  g.lineStyle(4, pal.og, 0.2 * a);   g.strokeEllipse(cx, cy, rx * 2 + 3, ry * 2 + 3);
}

// ═══════════════════════════════════════════════════════════
//  BOOT — food + gene pickup textures
// ═══════════════════════════════════════════════════════════
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    // Physics placeholder
    const ph = this.make.graphics({ x: 0, y: 0, add: false });
    ph.fillStyle(0xffffff, 0.01); ph.fillRect(0, 0, 4, 4);
    ph.generateTexture('phys', 4, 4); ph.destroy();

    // Food: ornate coccus — layered glow + internal granule
    const fg = this.make.graphics({ x: 0, y: 0, add: false });
    fg.lineStyle(12, 0xff8800, 0.1); fg.strokeCircle(16, 16, 13);
    fg.lineStyle(6,  0xff8800, 0.22); fg.strokeCircle(16, 16, 11);
    fg.fillStyle(0x331a00, 1.0);      fg.fillCircle(16, 16, 8);
    fg.fillStyle(0xff8800, 0.3);      fg.fillCircle(16, 16, 7);
    fg.fillStyle(0xff4400, 0.6);      fg.fillCircle(16, 16, 3.5);
    fg.lineStyle(1.5, 0xff8800, 1.0); fg.strokeCircle(16, 16, 7);
    fg.lineStyle(0.8, 0xffcc66, 0.6); fg.strokeCircle(16, 16, 8.5);
    fg.generateTexture('food', 32, 32); fg.destroy();

    // Gene pickups: plasmid ring style
    GENE_KEYS.forEach(key => {
      const c  = GENES[key].color;
      const gg = this.make.graphics({ x: 0, y: 0, add: false });
      gg.lineStyle(14, c, 0.08); gg.strokeCircle(20, 20, 17);
      gg.lineStyle(7,  c, 0.20); gg.strokeCircle(20, 20, 14);
      gg.lineStyle(2.0, c, 1.0); gg.strokeCircle(20, 20, 11);
      gg.fillStyle(c, 0.12);     gg.fillCircle(20, 20, 10);
      // Double-helix ladder rungs
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const x = 9 + t * 22;
        const y1 = 20 + Math.sin(t * Math.PI * 2.5) * 8;
        const y2 = 20 - Math.sin(t * Math.PI * 2.5) * 8;
        gg.fillStyle(c, 0.95); gg.fillCircle(x, y1, 2.0); gg.fillCircle(x, y2, 2.0);
        if (i % 2 === 0) { gg.lineStyle(0.8, c, 0.45); gg.lineBetween(x, y1, x, y2); }
      }
      gg.generateTexture('gene_' + key, 40, 40); gg.destroy();
    });

    this.scene.start('Game');
  }
}

// ═══════════════════════════════════════════════════════════
//  GAME SCENE
// ═══════════════════════════════════════════════════════════
class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    this.bgGfx = this.add.graphics();
    this._drawBackground();

    this.foodGroup = this.physics.add.staticGroup();
    this._spawnFood(100);
    this.geneGroup = this.physics.add.staticGroup();
    this._spawnGenes(20);

    this.player = this.physics.add.image(WORLD_W / 2, WORLD_H / 2, 'phys');
    this.player.setAlpha(0).setCollideWorldBounds(true)
               .setDamping(true).setDrag(0.90).setMaxVelocity(340).setDepth(10);
    this.player.body.setCircle(22, -20, -20);

    this.entityGfx    = this.add.graphics().setDepth(9);
    this.flagGfx      = this.add.graphics().setDepth(8);
    this.organelleGfx = this.add.graphics().setDepth(11);
    this.fxGfx        = this.add.graphics().setDepth(20);

    this.npcCells = [];
    this._spawnNPCs(18);

    this.predator = this.physics.add.image(
      Phaser.Math.Between(600, WORLD_W - 600),
      Phaser.Math.Between(600, WORLD_H - 600),
      'phys'
    );
    this.predator.setAlpha(0).setCollideWorldBounds(true)
                 .setDamping(true).setDrag(0.95).setMaxVelocity(150).setDepth(8);
    this.predator.body.setCircle(58, -56, -56);

    this.daughters = [];

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(ZOOM);

    this._createHUD();
    this._setupKeyboard();
    this._setupTouch();

    this.physics.add.overlap(this.player, this.foodGroup, this._eatFood,     null, this);
    this.physics.add.overlap(this.player, this.geneGroup, this._collectGene, null, this);
    this.physics.add.overlap(this.player, this.predator,  this._engulf,      null, this);

    this.energy        = 100;
    this.activeGenes   = new Set();
    this.alive         = true;
    this.fissioning    = false;
    this.engulfing     = false;
    this.dying         = false;
    this.dyingPulse    = false;
    this.playerAlpha   = 1.0;
    this.temp          = 37;
    this.targetTemp    = 37;
    this.tempTimer     = 0;
    this.tempInterval  = 15000;
    this.flagPhase     = 0;
    this.flagSpeed     = 0;
    this.tumbling      = false;
    this.tumbleAngle   = 0;
    this.tumbleTimer   = 0;
    this.bacterioTimer = 0;
    this.conjTarget    = null;
    this.conjTimer     = 0;
    this.conjDuration  = 1800;
    this.startTime     = this.time.now;
    this.killCount     = 0;
    this.score         = 0;
    this.touchFission  = false;
    this.touchBact     = false;
    this.touchConj     = false;
    this.fissionScale  = { x: 1, y: 1 };
    // Ocean current — slow drift that shifts direction over time
    this.current = {
      angle:          Math.random() * Math.PI * 2,
      speed:          20,
      changeTimer:    0,
      changeInterval: 18000,
      targetAngle:    Math.random() * Math.PI * 2,
    };
  }

  update(time, delta) {
    if (!this.alive || this.dying) return;
    const dt = delta / 1000;

    if (!this.fissioning) {
      this._updateTemp(dt);
      this._updateEnergy(dt);
      this._handleMovement(delta, dt);
    }

    this.entityGfx.clear();
    this.flagGfx.clear();
    this.organelleGfx.clear();

    this._drawAllCells();
    this._updatePredator(delta);
    this._updateDaughters(delta);
    this._updateNPCs(delta);
    this._updateConjugation(delta);
    this._drawJoystick();
    this._updateHUD(time);
    this._updateEnvTint();

    if (this.bacterioTimer > 0) this.bacterioTimer -= delta;

    // Tick score (1 pt/sec + energy bonus)
    this.score = Math.floor((this.time.now - this.startTime) / 1000) * 10
               + this.killCount * 100
               + Math.floor(this.energy);

    // Update ocean current direction
    this.current.changeTimer += delta;
    if (this.current.changeTimer >= this.current.changeInterval) {
      this.current.changeTimer = 0;
      this.current.targetAngle = Math.random() * Math.PI * 2;
    }
    this.current.angle += (this.current.targetAngle - this.current.angle) * 0.0008 * delta;
    if (!this.fissioning) {
      const dt2 = delta / 1000;
      this.player.body.velocity.x += Math.cos(this.current.angle) * this.current.speed * dt2;
      this.player.body.velocity.y += Math.sin(this.current.angle) * this.current.speed * dt2;
    }

    if (!this.fissioning) {
      if (this.energy > 150 && (Phaser.Input.Keyboard.JustDown(this.wasd.fiss) || this.touchFission)) {
        this.touchFission = false; this._triggerFission();
      }
      if (Phaser.Input.Keyboard.JustDown(this.wasd.bact) || this.touchBact) {
        this.touchBact = false; this._fireBacteriocin();
      }
      if (Phaser.Input.Keyboard.JustDown(this.wasd.conj) || this.touchConj) {
        this.touchConj = false; this._startConjugation();
      }
    }

    if (this.foodGroup.getLength() < 30) this._spawnFood(20);
  }

  // ── Draw all cell bodies ──────────────────────────────────
  _drawAllCells() {
    const g = this.entityGfx, fg = this.flagGfx, og = this.organelleGfx;
    const pal = this._getPlayerPalette();
    const pa = this.playerAlpha;

    const rx = 14 * CELL_S * this.fissionScale.x;
    const ry = 52 * CELL_S * this.fissionScale.y;
    const angle = this.player.rotation;

    drawBacteria(g, this.player.x, this.player.y, angle, rx, ry, pal, pa);
    this._drawOrganelles(og, this.player.x, this.player.y, angle, pal.outer, pa, CELL_S);

    this.flagPhase += 0.12 + this.flagSpeed * 0.18;
    const pRear = 55 * CELL_S;
    this._drawFlagellum(fg, this.player.x, this.player.y, angle, this.flagPhase, pal, pa, pRear);
    if (this.activeGenes.has('FLAGELLUM')) {
      this._drawFlagellum(fg, this.player.x, this.player.y, angle + 0.35, this.flagPhase + Math.PI, pal, pa, pRear);
    }

    drawPredator(g, this.predator.x, this.predator.y, 58 * CELL_S, 46 * CELL_S, 1.0, this.flagPhase);

    this.daughters.forEach(d => {
      if (!d.active) return;
      const da = Phaser.Math.DegToRad(d.angle - 90);
      drawBacteria(g, d.x, d.y, da, 10 * CELL_S, 38 * CELL_S, PAL.daughter, 1.0);
      this._drawFlagellum(fg, d.x, d.y, da, d.flagPhase, PAL.daughter, 1.0, 42 * CELL_S);
    });

    this.npcCells.forEach(npc => {
      if (!npc.active) return;
      const na = Phaser.Math.DegToRad(npc.angle - 90);
      drawBacteria(g, npc.x, npc.y, na, 10 * CELL_S, 38 * CELL_S, npc.palette, 1.0);
      this._drawFlagellum(fg, npc.x, npc.y, na, npc.flagPhase, npc.palette, 1.0, 42 * CELL_S);
    });
  }

  // ── Multi-strand flagellum ────────────────────────────────
  _drawFlagellum(fg, px, py, baseAngle, phase, pal, alpha, rearDist) {
    const len = 65, segs = 20;
    const amp = 4.5 + this.flagSpeed * 3.5;
    const strands = DETAIL ? [-0.12, 0, 0.12] : [0];

    strands.forEach((off, oi) => {
      const ba   = baseAngle + off;
      const perpX = Math.cos(ba + Math.PI / 2), perpY = Math.sin(ba + Math.PI / 2);
      const backX = Math.cos(ba + Math.PI),     backY = Math.sin(ba + Math.PI);
      const sx = px + backX * rearDist, sy = py + backY * rearDist;

      fg.lineStyle(3, pal.outer, 0.07 * alpha);
      fg.beginPath(); fg.moveTo(sx, sy);
      for (let i = 1; i <= segs; i++) {
        const t  = i / segs;
        const fx = sx + backX * len * t, fy = sy + backY * len * t;
        const w  = Math.sin(phase + oi * 1.3 + t * Math.PI * 2.8) * amp * (1 - t * 0.45);
        fg.lineTo(fx + perpX * w, fy + perpY * w);
      }
      fg.strokePath();

      fg.lineStyle(0.9, pal.outer, 0.75 * alpha);
      fg.beginPath(); fg.moveTo(sx, sy);
      for (let i = 1; i <= segs; i++) {
        const t  = i / segs;
        const fx = sx + backX * len * t, fy = sy + backY * len * t;
        const w  = Math.sin(phase + oi * 1.3 + t * Math.PI * 2.8) * amp * (1 - t * 0.45);
        fg.lineTo(fx + perpX * w, fy + perpY * w);
      }
      fg.strokePath();
    });
  }

  // ── Gene organelle overlays ───────────────────────────────
  _drawOrganelles(og, px, py, angle, outerColor, alpha, scale) {
    if (this.activeGenes.size === 0) return;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const rot = (x, y) => ({ x: px + x*cos - y*sin, y: py + x*sin + y*cos });
    const s = (scale || 1) * 0.55;

    if (this.activeGenes.has('HSP')) {
      og.fillStyle(GENES.HSP.color, 0.72 * alpha);
      [[-4,-44],[4,-44],[-4,44],[4,44],[0,-28],[0,28]].forEach(([x, y]) => {
        const p = rot(x*s, y*s); og.fillCircle(p.x, p.y, 2.8*s);
      });
    }
    if (this.activeGenes.has('CSP')) {
      og.fillStyle(GENES.CSP.color, 0.62 * alpha);
      for (let i = -3; i <= 3; i++) {
        const p = rot(0, i * 16 * s); og.fillCircle(p.x, p.y, 2.5*s);
      }
    }
    if (this.activeGenes.has('FLAGELLUM')) {
      og.lineStyle(1.5, GENES.FLAGELLUM.color, 0.5 * alpha);
      const a2 = rot(0, -30*s), b2 = rot(0, 30*s);
      og.lineBetween(a2.x, a2.y, b2.x, b2.y);
    }
    if (this.activeGenes.has('MEMBRANE')) {
      og.lineStyle(2.5, GENES.MEMBRANE.color, 0.22 * alpha);
      const segs = 24;
      for (let i = 0; i < segs; i++) {
        const a1 = (i/segs)*Math.PI*2, a2 = ((i+1)/segs)*Math.PI*2;
        const p1 = rot(Math.cos(a1)*26*s, Math.sin(a1)*100*s);
        const p2 = rot(Math.cos(a2)*26*s, Math.sin(a2)*100*s);
        og.lineBetween(p1.x, p1.y, p2.x, p2.y);
      }
    }
    if (this.activeGenes.has('TOXIN')) {
      og.lineStyle(1.5, GENES.TOXIN.color, 0.68 * alpha);
      [[7,0],[-7,18],[7,-18]].forEach(([x, y]) => {
        const p = rot(x*s, y*s); og.strokeCircle(p.x, p.y, 4.5*s);
      });
    }
  }

  // ── Player palette — shifts toward active gene colours ────
  _getPlayerPalette() {
    if (this.activeGenes.size === 0) return PAL.player;
    let r = (PAL.player.outer >> 16) & 0xff;
    let gr = (PAL.player.outer >> 8) & 0xff;
    let b = PAL.player.outer & 0xff;
    this.activeGenes.forEach(key => {
      const c = GENES[key].color;
      r  = Math.min(255, r  + (((c >> 16) & 0xff) * 0.28)) | 0;
      gr = Math.min(255, gr + (((c >> 8)  & 0xff) * 0.28)) | 0;
      b  = Math.min(255, b  + ((c & 0xff)          * 0.28)) | 0;
    });
    const blended = (r << 16) | (gr << 8) | b;
    return Object.assign({}, PAL.player, { outer: blended });
  }

  _getPlayerOuterColor() { return this._getPlayerPalette().outer; }

  // ── Temperature ───────────────────────────────────────────
  _updateTemp(dt) {
    this.tempTimer += dt * 1000;
    if (this.tempTimer >= this.tempInterval) {
      this.tempTimer = 0;
      const r = Math.random();
      this.targetTemp = r < 0.33 ? Phaser.Math.Between(55, 70) :
                        r < 0.66 ? Phaser.Math.Between(10, 20) : 37;
    }
    this.temp += (this.targetTemp - this.temp) * dt * 0.3;
  }

  // ── Energy ────────────────────────────────────────────────
  _updateEnergy(dt) {
    let drain = 1.0;
    if (this.activeGenes.has('FLAGELLUM')) drain += 0.1;
    const speed = Math.hypot(this.player.body.velocity.x, this.player.body.velocity.y);
    drain += speed * 0.003;
    const isHot = this.temp > 42, isCold = this.temp < 30;
    if (isHot || isCold) drain *= (isHot ? this.activeGenes.has('HSP') : this.activeGenes.has('CSP')) ? 2 : 4;
    this.energy -= drain * dt;

    if (this.energy < 30 && !this.dyingPulse) {
      this.dyingPulse = true; this._pulseLow();
    }
    if (this.energy <= 0) { this.energy = 0; this._implode(); }
  }

  _pulseLow() {
    if (!this.alive || this.dying) return;
    this.playerAlpha = this.playerAlpha > 0.6 ? 0.35 : 1.0;
    this.time.delayedCall(220, () => this._pulseLow());
  }

  // ── Movement ──────────────────────────────────────────────
  _handleMovement(delta, dt) {
    let baseSpeed = 280;
    if (this.activeGenes.has('FLAGELLUM')) baseSpeed *= 1.4;
    if (this.activeGenes.has('MEMBRANE'))  baseSpeed *= 0.85;

    const tumbleKey = this.cursors.space.isDown || this.wasd.space.isDown;
    if (tumbleKey && !this.tumbling) {
      this.tumbling    = true;
      this.tumbleTimer = 350 + Math.random() * 200;
      this.tumbleAngle = (Math.random() < 0.5 ? -1 : 1) * (90 + Math.random() * 180);
      this.player.body.setAcceleration(0, 0);
    }
    if (this.tumbling) {
      this.player.angle += this.tumbleAngle * dt;
      this.tumbleTimer  -= delta;
      if (this.tumbleTimer <= 0) this.tumbling = false;
      return;
    }

    if (this.joystick.active && (Math.abs(this.joystick.dx) > 0.1 || Math.abs(this.joystick.dy) > 0.1)) {
      this.player.body.setAcceleration(this.joystick.dx * baseSpeed * 2.2, this.joystick.dy * baseSpeed * 2.2);
      this.player.rotation = Math.atan2(this.joystick.dy, this.joystick.dx) + Math.PI / 2;
      this.flagSpeed = 1.0;
      return;
    }

    const up    = this.cursors.up.isDown    || this.wasd.up.isDown;
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown;
    const left  = this.cursors.left.isDown  || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;

    if (left)  this.player.angle -= 3;
    if (right) this.player.angle += 3;

    if (up) {
      const rad = Phaser.Math.DegToRad(this.player.angle - 90);
      this.player.body.setAcceleration(Math.cos(rad) * baseSpeed * 2, Math.sin(rad) * baseSpeed * 2);
      this.flagSpeed = 1.0;
    } else if (down) {
      const rad = Phaser.Math.DegToRad(this.player.angle + 90);
      this.player.body.setAcceleration(Math.cos(rad) * baseSpeed, Math.sin(rad) * baseSpeed);
      this.flagSpeed = 0.5;
    } else {
      this.player.body.setAcceleration(0, 0);
      this.flagSpeed = Math.max(0, this.flagSpeed - 0.03);
    }
  }

  // ── Food + Gene ───────────────────────────────────────────
  _eatFood(player, food) {
    food.destroy();
    this.energy = Math.min(200, this.energy + 22);
    this.playerAlpha = 1.4;
    this.time.delayedCall(80, () => { this.playerAlpha = 1.0; });
  }

  _collectGene(player, pick) {
    if (!pick.active) return;
    const key = pick.getData('geneKey');
    if (this.activeGenes.size >= 3 || this.activeGenes.has(key)) {
      this.tweens.add({ targets: pick, alpha: 0.3, duration: 250, yoyo: true });
      return;
    }
    pick.destroy();
    this.activeGenes.add(key);
    this._updateGeneHUD();
    if (this.dyingPulse && this.energy > 30) { this.dyingPulse = false; this.playerAlpha = 1.0; }
    const gc = GENES[key].color;
    this.cameras.main.flash(180, (gc >> 16) & 0xff, (gc >> 8) & 0xff, gc & 0xff, true);
  }

  // ── NPC bacteria ──────────────────────────────────────────
  _spawnNPCs(n) {
    for (let i = 0; i < n; i++) {
      const x = Phaser.Math.Between(300, WORLD_W - 300);
      const y = Phaser.Math.Between(300, WORLD_H - 300);
      const npc = this.physics.add.image(x, y, 'phys');
      npc.setAlpha(0).setCollideWorldBounds(true).setDamping(true).setDrag(0.93).setMaxVelocity(140).setDepth(10);
      npc.body.setCircle(16, -14, -14);
      npc.hp         = 2;
      npc.genes      = new Set();
      npc.palette    = NPC_PALS[i % 4];
      const shuffled = Phaser.Utils.Array.Shuffle([...GENE_KEYS]);
      npc.genes.add(shuffled[0]);
      if (Math.random() < 0.5) npc.genes.add(shuffled[1]);
      npc.wanderDir  = Math.random() * Math.PI * 2;
      npc.wanderTimer = 0;
      npc.flagPhase  = Math.random() * Math.PI * 2;
      npc.angle      = 0;
      this.npcCells.push(npc);
      this.physics.add.overlap(this.player, npc, () => this._collideNPC(npc), null, this);
    }
  }

  _updateNPCs(delta) {
    for (let i = this.npcCells.length - 1; i >= 0; i--) {
      const npc = this.npcCells[i];
      if (!npc.active) { this.npcCells.splice(i, 1); continue; }
      npc.wanderTimer -= delta;
      if (npc.wanderTimer <= 0) {
        npc.wanderDir   += (Math.random() - 0.5) * 1.2;
        npc.wanderTimer  = 1000 + Math.random() * 2000;
        npc.body.setVelocity(Math.cos(npc.wanderDir) * 70, Math.sin(npc.wanderDir) * 70);
      }
      npc.angle     = Phaser.Math.RadToDeg(npc.wanderDir) + 90;
      npc.flagPhase += 0.09;
    }
  }

  _collideNPC(npc) {
    if (!npc || !npc.active) return;
    if (Math.hypot(this.player.body.velocity.x, this.player.body.velocity.y) < 200) return;
    npc.hp--;
    if (npc.hp <= 0) this._killCell(npc);
  }

  _killCell(cell) {
    if (!cell || !cell.active) return;
    const cx = cell.x, cy = cell.y;
    if (cell.genes) {
      cell.genes.forEach(key => {
        const gx = cx + Phaser.Math.Between(-28, 28);
        const gy = cy + Phaser.Math.Between(-28, 28);
        const g  = this.geneGroup.create(gx, gy, 'gene_' + key).setDepth(6).setTint(GENES[key].color);
        g.setData('geneKey', key);
        this.tweens.add({ targets: g, y: gy - 6, duration: 1400 + Math.random()*400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      });
    }
    this.killCount++;
    const flash = this.add.graphics().setDepth(22);
    flash.lineStyle(3, 0xffffff, 0.8); flash.strokeCircle(cx, cy, 22);
    this.tweens.add({ targets: flash, alpha: 0, scaleX: 2.5, scaleY: 2.5, duration: 350, onComplete: () => flash.destroy() });
    cell.destroy();
  }

  // ── Bacteriocin ───────────────────────────────────────────
  _fireBacteriocin() {
    if (this.bacterioTimer > 0 || this.energy < 30) return;
    this.energy -= 30; this.bacterioTimer = 5000;
    const range = this.activeGenes.has('TOXIN') ? 210 : 140;
    const px = this.player.x, py = this.player.y;
    const ring = this.add.graphics().setDepth(18);
    ring.lineStyle(3, 0xff44aa, 1.0); ring.strokeCircle(px, py, 10);
    this.tweens.add({ targets: ring, scaleX: range/10, scaleY: range/10, alpha: 0, duration: 440, ease: 'Power2', onComplete: () => ring.destroy() });
    [...this.npcCells, ...this.daughters].forEach(c => {
      if (c.active && Phaser.Math.Distance.Between(px, py, c.x, c.y) < range) this._killCell(c);
    });
  }

  // ── Conjugation ───────────────────────────────────────────
  _startConjugation() {
    if (this.conjTarget) return;
    let nearest = null, nearDist = 140;
    [...this.daughters, ...this.npcCells].filter(c => c.active && c.genes && c.genes.size > 0).forEach(c => {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y);
      if (d < nearDist) { nearDist = d; nearest = c; }
    });
    if (!nearest) return;
    this.conjTarget = nearest; this.conjTimer = 0;
  }

  _updateConjugation(delta) {
    if (!this.conjTarget) return;
    if (!this.conjTarget.active) { this.conjTarget = null; return; }
    this.conjTimer += delta;
    const t = this.conjTimer / this.conjDuration;

    this.fxGfx.clear();
    this.fxGfx.lineStyle(2, 0xffff55, 0.4 + Math.sin(t * Math.PI * 6) * 0.4);
    this.fxGfx.lineBetween(this.player.x, this.player.y, this.conjTarget.x, this.conjTarget.y);

    if (this.conjTimer >= this.conjDuration) {
      this.fxGfx.clear();
      const geneArr = Array.from(this.conjTarget.genes);
      if (geneArr.length > 0 && this.activeGenes.size < 3) {
        const key = geneArr[Math.floor(Math.random() * geneArr.length)];
        if (!this.activeGenes.has(key)) {
          this.activeGenes.add(key); this.conjTarget.genes.delete(key);
          this._updateGeneHUD();
          this.playerAlpha = 0.4;
          this.time.delayedCall(150, () => { this.playerAlpha = 1.0; });
        }
      }
      this.conjTarget = null;
    }
  }

  // ── Predator AI ───────────────────────────────────────────
  _updatePredator(delta) {
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.predator.x, this.predator.y);
    if (dist < 300) {
      this.physics.moveToObject(this.predator, this.player, 130);
    } else {
      if (!this.predator.wanderTimer || this.predator.wanderTimer <= 0) {
        const a = Math.random() * Math.PI * 2;
        this.predator.body.setVelocity(Math.cos(a) * 45, Math.sin(a) * 45);
        this.predator.wanderTimer = 2000 + Math.random() * 3000;
      }
      this.predator.wanderTimer -= delta;
    }
    if (dist < 200) this._drawPseudopods();
  }

  _drawPseudopods() {
    const g = this.entityGfx;
    for (let i = 0; i < 3; i++) {
      const ba  = Math.atan2(this.player.y - this.predator.y, this.player.x - this.predator.x) + (i-1)*0.4;
      const len = 52 + Math.sin(this.flagPhase*2 + i)*14;
      const perpX = Math.cos(ba + Math.PI/2), perpY = Math.sin(ba + Math.PI/2);
      g.lineStyle(2.5, PAL.predator.outer, 0.6);
      g.beginPath();
      g.moveTo(this.predator.x + Math.cos(ba)*60, this.predator.y + Math.sin(ba)*48);
      for (let s = 1; s <= 14; s++) {
        const t   = s / 14;
        const cx2 = this.predator.x + Math.cos(ba)*(60 + len*t);
        const cy2 = this.predator.y + Math.sin(ba)*(48 + len*t);
        const w   = Math.sin(this.flagPhase*1.5 + i*2 + t*Math.PI*2) * 4;
        g.lineTo(cx2 + perpX*w, cy2 + perpY*w);
      }
      g.strokePath();
    }
  }

  // ── Engulf / lysis / implosion / fission ──────────────────
  _engulf() {
    if (this.engulfing || this.fissioning || this.dying) return;
    this.engulfing = true;
    const resist = this.activeGenes.has('MEMBRANE');
    let pulseCount = resist ? 6 : 2;
    const doPulse = () => {
      if (pulseCount-- <= 0 || !this.alive) { if (this.alive) this._lyse('LYSED BY PREDATOR'); return; }
      this.playerAlpha = 0.2;
      this.time.delayedCall(120, () => { this.playerAlpha = 1.0; this.time.delayedCall(120, doPulse); });
    };
    doPulse();
  }

  _lyse(reason) {
    if (!this.alive || this.dying) return;
    this.alive = false; this.dying = true;
    this.player.body.setVelocity(0, 0).setAcceleration(0, 0);
    const px = this.player.x, py = this.player.y;
    const color = this._getPlayerOuterColor();
    this.playerAlpha = 0;

    for (let i = 0; i < 12; i++) {
      const a    = (i / 12) * Math.PI * 2;
      const frag = this.add.graphics().setDepth(22).setPosition(px, py);
      const fa   = a + (Math.random() - 0.5) * 0.5;
      frag.lineStyle(2, color, 0.9);
      frag.beginPath(); frag.arc(0, 0, 14 + Math.random()*10, fa, fa + 0.7, false); frag.strokePath();
      frag.fillStyle(color, 0.55); frag.fillCircle(Math.cos(fa)*8, Math.sin(fa)*8, 2);
      const dist2 = 65 + Math.random() * 40;
      this.tweens.add({ targets: frag, x: px + Math.cos(a)*dist2, y: py + Math.sin(a)*dist2, alpha: 0, duration: 680 + Math.random()*250, ease: 'Power2', onComplete: () => frag.destroy() });
    }
    this.time.delayedCall(800, () => this._showGameOver(reason));
  }

  _implode() {
    if (!this.alive || this.dying) return;
    this.alive = false; this.dying = true;
    this.player.body.setVelocity(0, 0).setAcceleration(0, 0);
    const px = this.player.x, py = this.player.y;
    const color = this._getPlayerOuterColor();

    this.fissionScale = { x: 1, y: 1 };
    this.time.addEvent({
      delay: 40, repeat: 14,
      callback: () => {
        this.fissionScale.x = Math.max(0, this.fissionScale.x - 0.07);
        this.fissionScale.y = Math.max(0, this.fissionScale.y - 0.07);
      }
    });

    for (let i = 0; i < 8; i++) {
      const a    = (i / 8) * Math.PI * 2;
      const frag = this.add.graphics().setDepth(22);
      frag.fillStyle(color, 0.75); frag.fillCircle(0, 0, 3);
      frag.setPosition(px + Math.cos(a)*55, py + Math.sin(a)*55);
      this.tweens.add({ targets: frag, x: px, y: py, alpha: 0, duration: 500, ease: 'Power2', onComplete: () => frag.destroy() });
    }
    this.time.delayedCall(740, () => this._showGameOver('ENERGY DEPLETED'));
  }

  _triggerFission() {
    if (this.fissioning) return;
    this.fissioning = true;
    this.fissionScale = { x: 1, y: 1 };
    let tick = 0;
    const anim = this.time.addEvent({
      delay: 30, repeat: 12,
      callback: () => {
        tick++;
        this.fissionScale.x = 1 - tick * 0.03;
        this.fissionScale.y = 1 + tick * 0.04;
        if (tick >= 12) { anim.remove(); this._completeFission(); }
      }
    });
  }

  _completeFission() {
    const dx = Phaser.Math.Between(-55, 55), dy = Phaser.Math.Between(-55, 55);
    const d  = this.physics.add.image(this.player.x + dx, this.player.y + dy, 'phys');
    d.setAlpha(0).setCollideWorldBounds(true).setDamping(true).setDrag(0.93).setMaxVelocity(200).setDepth(10);
    d.body.setCircle(16, -14, -14);
    d.hp = 3; d.genes = new Set(this.activeGenes);
    d.wanderDir = Math.random() * Math.PI * 2; d.wanderTimer = 0; d.flagPhase = 0; d.angle = 0;
    this.daughters.push(d);

    const a = Math.atan2(dy, dx);
    d.body.setVelocity(Math.cos(a) * 120, Math.sin(a) * 120);
    this.player.body.setVelocity(-Math.cos(a) * 80, -Math.sin(a) * 80);
    this.physics.add.overlap(this.player, d, () => this._collideNPC(d), null, this);

    this.player.angle = 0;
    this.fissionScale = { x: 1, y: 1 };
    this.energy       = 80;
    this.activeGenes  = new Set();
    this.dyingPulse   = false;
    this.playerAlpha  = 1.0;
    this.fissioning   = false;
    this._updateGeneHUD();
  }

  // ── Daughters ─────────────────────────────────────────────
  _updateDaughters(delta) {
    for (let i = this.daughters.length - 1; i >= 0; i--) {
      const d = this.daughters[i];
      if (!d.active) { this.daughters.splice(i, 1); continue; }
      d.wanderTimer -= delta;
      if (d.wanderTimer <= 0) {
        d.wanderDir   += (Math.random() - 0.5) * 1.5;
        d.wanderTimer  = 900 + Math.random() * 1500;
        d.body.setVelocity(Math.cos(d.wanderDir)*80, Math.sin(d.wanderDir)*80);
      }
      d.angle     = Phaser.Math.RadToDeg(d.wanderDir) + 90;
      d.flagPhase += 0.1;
    }
  }

  // ── Env tint ──────────────────────────────────────────────
  _updateEnvTint() {
    const t = this.temp;
    if (t > 42) {
      const i = Math.min((t-42)/28, 1) * 0.22;
      this.cameras.main.setBackgroundColor(Phaser.Display.Color.GetColor(Math.floor(i*90), 0, 8));
    } else if (t < 30) {
      const i = Math.min((30-t)/20, 1) * 0.22;
      this.cameras.main.setBackgroundColor(Phaser.Display.Color.GetColor(0, 0, Math.floor(8+i*90)));
    } else {
      this.cameras.main.setBackgroundColor(0x07071a);
    }
  }

  // ── HUD ───────────────────────────────────────────────────
  _createHUD() {
    const w = this.cameras.main.width, h = this.cameras.main.height;
    this.hudCon = this.add.container(0, 0).setScrollFactor(0).setDepth(100);

    this.energyBarBg = this.add.graphics();
    this.energyBarBg.fillStyle(0x111122, 0.5); this.energyBarBg.fillRect(0, 0, w, 6);
    this.hudCon.add(this.energyBarBg);

    this.energyBar = this.add.graphics();
    this.hudCon.add(this.energyBar);

    this.tempText = this.add.text(w - 10, 10, '37°C', {
      fontSize: '12px', fill: '#33cc66', fontFamily: 'monospace'
    }).setOrigin(1, 0);
    this.hudCon.add(this.tempText);

    this.scoreText = this.add.text(10, 10, '0', {
      fontSize: '14px', fill: '#ffd060', fontFamily: 'monospace', fontStyle: 'bold'
    });
    this.hudCon.add(this.scoreText);

    // Current arrow — compass indicator bottom-left above action buttons
    this.currentArrowGfx = this.add.graphics().setScrollFactor(0).setDepth(101);
    this.hudCon.add(this.currentArrowGfx);

    this.geneSlots = [];
    for (let i = 0; i < 3; i++) {
      const sx = w/2 - 44 + i * 44, sy = h - 38;
      const bg = this.add.graphics();
      bg.lineStyle(1, 0x224433, 0.7); bg.strokeRect(sx-16, sy-16, 32, 32);
      this.hudCon.add(bg);
      const lbl = this.add.text(sx, sy, '', {
        fontSize: '14px', fill: '#aaffaa', fontFamily: 'monospace'
      }).setOrigin(0.5, 0.5);
      this.hudCon.add(lbl);
      this.geneSlots.push({ bg, lbl, sx, sy });
    }

    this.fissText = this.add.text(w/2, h - 72, 'F  DIVIDE', {
      fontSize: '13px', fill: '#ffd060', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0);
    this.hudCon.add(this.fissText);

    this.bactText = this.add.text(10, h - 18, '', {
      fontSize: '9px', fill: '#ff88aa', fontFamily: 'monospace'
    });
    this.hudCon.add(this.bactText);

    this.conjHint = this.add.text(w - 10, h - 18, '', {
      fontSize: '9px', fill: '#ffff88', fontFamily: 'monospace', align: 'right'
    }).setOrigin(1, 0);
    this.hudCon.add(this.conjHint);

    this._buildActionButtons(w, h);
  }

  _buildActionButtons(w, h) {
    const btns = [
      { label: 'F', y: h-150, key: 'touchFission', color: 0xffd060 },
      { label: 'B', y: h-100, key: 'touchBact',    color: 0xff88aa },
      { label: 'C', y: h-50,  key: 'touchConj',    color: 0xffff88 },
    ];
    btns.forEach(b => {
      const hexStr = '#' + b.color.toString(16).padStart(6, '0');
      const btn = this.add.text(w - 28, b.y, b.label, {
        fontSize: '13px', fill: hexStr, fontFamily: 'monospace'
      }).setScrollFactor(0).setDepth(200).setOrigin(0.5).setAlpha(0.3).setInteractive({ useHandCursor: false });
      const circ = this.add.graphics().setScrollFactor(0).setDepth(199);
      circ.lineStyle(1, b.color, 0.3); circ.strokeCircle(w - 28, b.y, 16);
      this.hudCon.add(circ);
      btn.on('pointerdown', () => { this[b.key] = true;  btn.setAlpha(1.0); });
      btn.on('pointerup',   () => { this[b.key] = false; btn.setAlpha(0.3); });
      btn.on('pointerout',  () => { this[b.key] = false; btn.setAlpha(0.3); });
      this.hudCon.add(btn);
    });

    const tcirc = this.add.graphics().setScrollFactor(0).setDepth(199);
    tcirc.lineStyle(1, 0xaabbcc, 0.3); tcirc.strokeCircle(28, h-130, 16);
    this.hudCon.add(tcirc);

    const tumbleBtn = this.add.text(28, h-130, 'T', {
      fontSize: '13px', fill: '#aabbcc', fontFamily: 'monospace'
    }).setScrollFactor(0).setDepth(200).setOrigin(0.5).setAlpha(0.3).setInteractive();
    tumbleBtn.on('pointerdown', () => {
      tumbleBtn.setAlpha(1.0);
      if (!this.tumbling) {
        this.tumbling    = true; this.tumbleTimer = 400;
        this.tumbleAngle = (Math.random() < 0.5 ? -1 : 1) * (90 + Math.random() * 180);
        this.player.body.setAcceleration(0, 0);
      }
    });
    tumbleBtn.on('pointerup',  () => tumbleBtn.setAlpha(0.3));
    tumbleBtn.on('pointerout', () => tumbleBtn.setAlpha(0.3));
    this.hudCon.add(tumbleBtn);
  }

  _updateHUD(time) {
    const w = this.cameras.main.width, h = this.cameras.main.height;
    const pct   = Math.min(this.energy / 200, 1);
    const color = this.energy > 150 ? 0xffd060 : this.energy > 50 ? 0xff8800 : 0xff4444;
    this.energyBar.clear();
    this.energyBar.fillStyle(color, 0.85);
    this.energyBar.fillRect(0, 0, Math.floor(w * pct), 6);

    const tc = this.temp > 50 ? '#ff5522' : this.temp < 25 ? '#55aaff' : '#33cc66';
    this.tempText.setText(`${Math.round(this.temp)}°C`).setStyle({ fill: tc });

    const sec = Math.floor((time - this.startTime) / 1000);
    this.scoreText.setText(`${this.score}  ${this.killCount > 0 ? this.killCount + '✕' : ''}`);

    // Fission ready — pulse when available
    if (this.energy > 150) {
      this.fissText.setAlpha(0.6 + Math.sin(time * 0.006) * 0.4);
    } else {
      this.fissText.setAlpha(0);
    }

    this.bactText.setText(this.bacterioTimer > 0 ? `B ${Math.ceil(this.bacterioTimer/1000)}s` : 'B ready');

    const allFriendly = [...this.daughters, ...this.npcCells];
    const near = allFriendly.some(c => c.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y) < 140);
    this.conjHint.setText(this.conjTarget ? 'conjugating...' : near ? 'C conjugate' : '');

    // Current direction arrow — small compass bottom-left
    this._drawCurrentArrow(h);

    this._updateGeneHUD();
  }

  _drawCurrentArrow(h) {
    const g = this.currentArrowGfx;
    g.clear();
    const cx = 28, cy = h - 185;
    const a  = this.current.angle;
    const r  = 14;
    // Background ring
    g.lineStyle(1, 0x334455, 0.5);
    g.strokeCircle(cx, cy, r);
    // Arrow
    g.lineStyle(1.5, 0x88bbdd, 0.7);
    g.lineBetween(cx - Math.cos(a)*r*0.6, cy - Math.sin(a)*r*0.6, cx + Math.cos(a)*r*0.85, cy + Math.sin(a)*r*0.85);
    const aw = 0.45;
    g.fillStyle(0x88bbdd, 0.7);
    g.fillTriangle(
      cx + Math.cos(a)*r, cy + Math.sin(a)*r,
      cx + Math.cos(a + Math.PI - aw)*r*0.45, cy + Math.sin(a + Math.PI - aw)*r*0.45,
      cx + Math.cos(a + Math.PI + aw)*r*0.45, cy + Math.sin(a + Math.PI + aw)*r*0.45
    );
  }

  _updateGeneHUD() {
    const gArr = Array.from(this.activeGenes);
    this.geneSlots.forEach((slot, i) => {
      const key = gArr[i];
      slot.lbl.setText(key ? GENES[key].symbol : '');
      slot.bg.clear();
      const col = key ? GENES[key].color : 0x224433;
      slot.bg.lineStyle(1, col, key ? 0.85 : 0.25);
      slot.bg.strokeRect(slot.sx - 16, slot.sy - 16, 32, 32);
      if (key) { slot.bg.fillStyle(col, 0.1); slot.bg.fillRect(slot.sx-16, slot.sy-16, 32, 32); }
      if (key) slot.lbl.setStyle({ fill: '#' + col.toString(16).padStart(6, '0') });
      else     slot.lbl.setStyle({ fill: '#aaffaa' });
    });
  }

  // ── Touch — swipe-to-row ──────────────────────────────────
  // Each swipe on the left ~2/3 of screen propels the cell in
  // the swipe direction (rowing). Repeated short strokes = swimming.
  _setupTouch() {
    this.swipe = { active: false, startX: 0, startY: 0, curX: 0, curY: 0 };
    this.swipeGfx = this.add.graphics().setScrollFactor(0).setDepth(150);
    // Keep joystick stub so _handleMovement reference doesn't break
    this.joystick = { active: false, dx: 0, dy: 0 };
    const RZ = this.cameras.main.width - 80;

    this.input.on('pointerdown', (p) => {
      if (p.x < RZ) {
        this.swipe.active = true;
        this.swipe.startX = p.x; this.swipe.startY = p.y;
        this.swipe.curX   = p.x; this.swipe.curY   = p.y;
      }
    });
    this.input.on('pointermove', (p) => {
      if (!this.swipe.active) return;
      this.swipe.curX = p.x; this.swipe.curY = p.y;
    });
    this.input.on('pointerup', (p) => {
      if (!this.swipe.active) return;
      this.swipe.active = false;
      const dx   = p.x - this.swipe.startX;
      const dy   = p.y - this.swipe.startY;
      const dist = Math.hypot(dx, dy);
      if (dist > 14 && this.alive && !this.dying && !this.fissioning) {
        const nx = dx / dist, ny = dy / dist;
        let baseSpeed = 280;
        if (this.activeGenes.has('FLAGELLUM')) baseSpeed *= 1.4;
        if (this.activeGenes.has('MEMBRANE'))  baseSpeed *= 0.85;
        const power = Math.min(dist, 100) / 100;
        this.player.body.velocity.x += nx * baseSpeed * 1.8 * power;
        this.player.body.velocity.y += ny * baseSpeed * 1.8 * power;
        // Rotate cell to face swipe direction
        this.player.rotation = Math.atan2(ny, nx) + Math.PI / 2;
        this.flagSpeed = power;
      }
    });
  }

  _drawJoystick() {
    this.swipeGfx.clear();
    if (!this.swipe.active) return;
    const { startX, startY, curX, curY } = this.swipe;
    const dx = curX - startX, dy = curY - startY;
    const dist = Math.hypot(dx, dy);
    // Anchor ring
    this.swipeGfx.lineStyle(1.5, 0xffffff, 0.12);
    this.swipeGfx.strokeCircle(startX, startY, 28);
    // Drag line
    if (dist > 6) {
      this.swipeGfx.lineStyle(2, PAL.player.outer, 0.5);
      this.swipeGfx.lineBetween(startX, startY, curX, curY);
      // Arrow head
      const a = Math.atan2(dy, dx);
      const tip = { x: curX, y: curY };
      const aw = 0.4;
      this.swipeGfx.fillStyle(PAL.player.outer, 0.6);
      this.swipeGfx.fillTriangle(
        tip.x, tip.y,
        tip.x - Math.cos(a - aw) * 12, tip.y - Math.sin(a - aw) * 12,
        tip.x - Math.cos(a + aw) * 12, tip.y - Math.sin(a + aw) * 12
      );
    }
  }

  _setupKeyboard() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd    = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W, down:  Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A, right: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE, fiss: Phaser.Input.Keyboard.KeyCodes.F,
      bact: Phaser.Input.Keyboard.KeyCodes.B, conj: Phaser.Input.Keyboard.KeyCodes.C,
    });
  }

  // ── Rich background ───────────────────────────────────────
  _drawBackground() {
    const g = this.bgGfx;

    // Base fill — dark navy
    g.fillStyle(0x07071a, 1.0);
    g.fillRect(0, 0, WORLD_W, WORLD_H);

    // Very faint hex-grid overlay (suggests microscope slide)
    g.lineStyle(0.5, 0x1a1a3a, 0.35);
    const gs = 120;
    for (let x = 0; x < WORLD_W; x += gs) { g.lineBetween(x, 0, x, WORLD_H); }
    for (let y = 0; y < WORLD_H; y += gs) { g.lineBetween(0, y, WORLD_W, y); }

    // Ghost bacteria — suggest a densely populated background community
    const ghostPals = [PAL.npc0, PAL.npc1, PAL.npc2, PAL.npc3, PAL.player];
    for (let i = 0; i < 120; i++) {
      const x   = Phaser.Math.Between(0, WORLD_W);
      const y   = Phaser.Math.Between(0, WORLD_H);
      const ang = Math.random() * Math.PI * 2;
      const s   = 0.4 + Math.random() * 0.5;
      const pal = ghostPals[i % 5];
      drawBacteriaSimple(g, x, y, ang, 10*s, 36*s, pal.outer, 0.25 + Math.random() * 0.2);
    }

    // Small cocci clusters
    for (let i = 0; i < 80; i++) {
      const cx = Phaser.Math.Between(0, WORLD_W), cy = Phaser.Math.Between(0, WORLD_H);
      const pal = ghostPals[i % 5];
      g.fillStyle(pal.outer, 0.12 + Math.random() * 0.1);
      g.fillCircle(cx, cy, 3 + Math.random() * 5);
      g.lineStyle(0.8, pal.outer, 0.25);
      g.strokeCircle(cx, cy, 3 + Math.random() * 5);
    }

    // Faint radial orientation markers
    g.lineStyle(0.5, 0x1a1a40, 0.25);
    for (let r = 400; r < 1600; r += 400) {
      g.strokeCircle(WORLD_W/2, WORLD_H/2, r);
    }
  }

  // ── Spawning ──────────────────────────────────────────────
  _spawnFood(n) {
    for (let i = 0; i < n; i++) {
      this.foodGroup.create(
        Phaser.Math.Between(50, WORLD_W-50),
        Phaser.Math.Between(50, WORLD_H-50),
        'food'
      ).setDepth(5);
    }
  }

  _spawnGenes(n) {
    for (let i = 0; i < n; i++) {
      const key = GENE_KEYS[i % GENE_KEYS.length];
      const x = Phaser.Math.Between(80, WORLD_W-80), y = Phaser.Math.Between(80, WORLD_H-80);
      const g = this.geneGroup.create(x, y, 'gene_' + key).setDepth(6).setTint(GENES[key].color);
      g.setData('geneKey', key);
      this.tweens.add({ targets: g, y: y-7, duration: 1500+Math.random()*500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  // ── Game over ─────────────────────────────────────────────
  _showGameOver(reason) {
    const elapsed = Math.floor((this.time.now - this.startTime) / 1000);
    const w = this.cameras.main.width, h = this.cameras.main.height;
    const ov = this.add.graphics().setScrollFactor(0).setDepth(200);
    ov.fillStyle(0x000000, 0.88); ov.fillRect(0, 0, w, h);

    this.add.text(w/2, h/2-55, reason || 'DEAD', {
      fontSize: '32px', fill: '#ff2244', fontFamily: 'monospace'
    }).setScrollFactor(0).setDepth(201).setOrigin(0.5);

    this.add.text(w/2, h/2, `${elapsed}s   ${this.killCount} kills`, {
      fontSize: '16px', fill: '#556677', fontFamily: 'monospace'
    }).setScrollFactor(0).setDepth(201).setOrigin(0.5);

    const rb = this.add.text(w/2, h/2+55, 'tap or any key', {
      fontSize: '12px', fill: '#ffd060', fontFamily: 'monospace'
    }).setScrollFactor(0).setDepth(201).setOrigin(0.5);
    this.tweens.add({ targets: rb, alpha: 0.15, duration: 700, yoyo: true, repeat: -1 });

    this.time.delayedCall(400, () => {
      this.input.keyboard.once('keydown', () => this.scene.restart());
      this.input.once('pointerdown',      () => this.scene.restart());
    });
  }
}

// ═══════════════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════════════
const config = {
  type: Phaser.AUTO,
  backgroundColor: '#07071a',
  width:  window.innerWidth,
  height: window.innerHeight,
  physics: { default: 'arcade', arcade: { debug: false } },
  scene:   [BootScene, GameScene],
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH, parent: document.body },
};

const game = new Phaser.Game(config);
window.addEventListener('resize', () => game.scale.resize(window.innerWidth, window.innerHeight));
