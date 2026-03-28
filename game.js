// ============================================================
//  Untitled Cell Game v3  —  Vector rendering, FISH palette
//  All cells drawn as crisp Graphics each frame (no texture rotation)
// ============================================================

const WORLD_W = 3200;
const WORLD_H = 3200;

// Scale cell size to screen — phones get smaller cells
const _minDim = Math.min(window.innerWidth, window.innerHeight);
const CELL_S  = Math.max(0.45, Math.min(1.0, _minDim / 550));  // 0.45–1.0
// Zoom out more on smaller screens so the world feels bigger
const ZOOM    = Math.max(0.55, Math.min(1.0, _minDim / 480));

// Fluorescence In Situ Hybridisation palette
const COL = {
  bg:        0x000008,
  cell:      0x00ff66,   // FITC green
  flagellum: 0x00cc44,
  food:      0xff8800,   // Cy3 orange
  predator:  0xff2200,   // Texas Red
  npc:       0x4488ff,   // DAPI blue
  daughter:  0x88ffcc,
  bacterio:  0xff44aa,
  pilus:     0xffff55,
  hud:       0x445544,
};

const GENES = {
  HSP:      { color: 0xff4400, symbol: 'H', desc: 'heat resist' },
  CSP:      { color: 0x4488ff, symbol: 'C', desc: 'cold resist' },
  FLAGELLUM:{ color: 0xccff00, symbol: 'F', desc: '+speed'      },
  MEMBRANE: { color: 0xff8800, symbol: 'M', desc: '+defense'    },
  TOXIN:    { color: 0xcc44ff, symbol: 'T', desc: '+bact range' },
};
const GENE_KEYS = Object.keys(GENES);

// ─────────────────────────────────────────────────────────────
//  Graphics helpers
// ─────────────────────────────────────────────────────────────

// Plot a rotated ellipse path (no strokePath call — caller does it)
function ellipsePath(g, cx, cy, rx, ry, cos, sin, segs = 30) {
  g.beginPath();
  for (let i = 0; i <= segs; i++) {
    const a  = (i / segs) * Math.PI * 2;
    const ex = Math.cos(a) * rx, ey = Math.sin(a) * ry;
    const wx = cx + ex * cos - ey * sin;
    const wy = cy + ex * sin + ey * cos;
    i === 0 ? g.moveTo(wx, wy) : g.lineTo(wx, wy);
  }
  g.closePath();
}

// Fill a rotated ellipse using triangle fan
function fillEllipse(g, cx, cy, rx, ry, cos, sin, segs = 28) {
  for (let i = 0; i < segs; i++) {
    const a1 = (i / segs) * Math.PI * 2, a2 = ((i + 1) / segs) * Math.PI * 2;
    const p1x = cx + (Math.cos(a1)*rx)*cos - (Math.sin(a1)*ry)*sin;
    const p1y = cy + (Math.cos(a1)*rx)*sin + (Math.sin(a1)*ry)*cos;
    const p2x = cx + (Math.cos(a2)*rx)*cos - (Math.sin(a2)*ry)*sin;
    const p2y = cy + (Math.cos(a2)*rx)*sin + (Math.sin(a2)*ry)*cos;
    g.fillTriangle(cx, cy, p1x, p1y, p2x, p2y);
  }
}

// Draw a rod-shaped bacterium
function drawBacteria(g, cx, cy, angle, rx, ry, color, alpha) {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const a = alpha;

  // Glow layers
  g.lineStyle(16, color, 0.04 * a); ellipsePath(g, cx, cy, rx+16, ry+16, cos, sin); g.strokePath();
  g.lineStyle(8,  color, 0.10 * a); ellipsePath(g, cx, cy, rx+8,  ry+8,  cos, sin); g.strokePath();
  g.lineStyle(3,  color, 0.20 * a); ellipsePath(g, cx, cy, rx+3,  ry+3,  cos, sin); g.strokePath();

  // Interior subtle fill
  g.fillStyle(color, 0.05 * a);
  fillEllipse(g, cx, cy, rx, ry, cos, sin);

  // Membrane (sharp)
  g.lineStyle(1.8, color, 0.95 * a);
  ellipsePath(g, cx, cy, rx, ry, cos, sin); g.strokePath();

  // Nucleoid (elongated DNA region)
  g.lineStyle(1.0, color, 0.38 * a);
  ellipsePath(g, cx, cy, rx * 0.55, ry * 0.42, cos, sin); g.strokePath();

  // Ribosome dots
  g.fillStyle(color, 0.36 * a);
  for (let i = 0; i < 6; i++) {
    const ta = (i / 6) * Math.PI * 2;
    const ex = Math.cos(ta) * rx * 0.62, ey = Math.sin(ta) * ry * 0.62;
    g.fillCircle(cx + ex * cos - ey * sin, cy + ex * sin + ey * cos, 1.8);
  }
}

// Draw the predator (eukaryote blob, not rotated)
function drawPredator(g, cx, cy, rx, ry, alpha) {
  const c = COL.predator, a = alpha;
  g.lineStyle(20, c, 0.04 * a); g.strokeEllipse(cx, cy, rx*2+20, ry*2+20);
  g.lineStyle(10, c, 0.10 * a); g.strokeEllipse(cx, cy, rx*2+10, ry*2+10);
  g.lineStyle(4,  c, 0.20 * a); g.strokeEllipse(cx, cy, rx*2+4,  ry*2+4);
  g.fillStyle(c,  0.05 * a);    g.fillEllipse(cx, cy, rx*2, ry*2);
  g.lineStyle(2,  c, 0.95 * a); g.strokeEllipse(cx, cy, rx*2, ry*2);
  // nucleus
  g.lineStyle(2, c, 0.5 * a);   g.strokeCircle(cx, cy, rx * 0.28);
  g.fillStyle(c, 0.2 * a);      g.fillCircle(cx, cy, rx * 0.14);
  // organelles
  g.lineStyle(1, c, 0.25 * a);
  g.strokeEllipse(cx + rx*0.4, cy - ry*0.2, rx*0.28, ry*0.18);
  g.strokeEllipse(cx - rx*0.35, cy + ry*0.25, rx*0.26, ry*0.16);
  // ribosomes
  g.fillStyle(c, 0.32 * a);
  for (let i = 0; i < 9; i++) {
    const ta = (i / 9) * Math.PI * 2;
    g.fillCircle(cx + Math.cos(ta)*rx*0.55, cy + Math.sin(ta)*ry*0.52, 2);
  }
}

// ═══════════════════════════════════════════════════════════
//  BOOT — only food + gene pickup textures
// ═══════════════════════════════════════════════════════════
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    // Physics placeholder (invisible 4×4 pixel)
    const ph = this.make.graphics({ x: 0, y: 0, add: false });
    ph.fillStyle(0xffffff, 0.01); ph.fillRect(0, 0, 4, 4);
    ph.generateTexture('phys', 4, 4); ph.destroy();

    // Food: glowing coccus
    const fg = this.make.graphics({ x: 0, y: 0, add: false });
    fg.lineStyle(10, COL.food, 0.12); fg.strokeCircle(14, 14, 11);
    fg.lineStyle(5,  COL.food, 0.28); fg.strokeCircle(14, 14, 9);
    fg.lineStyle(1.5, COL.food, 1.0); fg.strokeCircle(14, 14, 6);
    fg.fillStyle(COL.food, 0.25);     fg.fillCircle(14, 14, 5);
    fg.fillStyle(COL.food, 0.6);      fg.fillCircle(14, 14, 1.5);
    fg.generateTexture('food', 28, 28); fg.destroy();

    // Gene pickups: glowing helix circles
    GENE_KEYS.forEach(key => {
      const c  = GENES[key].color;
      const gg = this.make.graphics({ x: 0, y: 0, add: false });
      gg.lineStyle(12, c, 0.1);  gg.strokeCircle(18, 18, 16);
      gg.lineStyle(6,  c, 0.22); gg.strokeCircle(18, 18, 13);
      gg.lineStyle(2,  c, 1.0);  gg.strokeCircle(18, 18, 11);
      for (let i = 0; i <= 10; i++) {
        const t = i / 10, x = 8 + t * 20;
        const y1 = 18 + Math.sin(t * Math.PI * 2.5) * 7;
        const y2 = 18 - Math.sin(t * Math.PI * 2.5) * 7;
        gg.fillStyle(c, 0.9); gg.fillCircle(x, y1, 1.8); gg.fillCircle(x, y2, 1.8);
      }
      gg.generateTexture('gene_' + key, 36, 36); gg.destroy();
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

    // Background
    this.bgGfx = this.add.graphics();
    this._drawBackground();

    // Food + genes
    this.foodGroup = this.physics.add.staticGroup();
    this._spawnFood(50);
    this.geneGroup = this.physics.add.staticGroup();
    this._spawnGenes(15);

    // ── Player (invisible physics body, drawn as graphics) ──
    this.player = this.physics.add.image(WORLD_W / 2, WORLD_H / 2, 'phys');
    this.player.setAlpha(0).setCollideWorldBounds(true)
               .setDamping(true).setDrag(0.90).setMaxVelocity(340).setDepth(10);
    this.player.body.setCircle(22, -20, -20);   // 22px radius hitbox centered

    // ── Graphics layers (drawn each frame) ──
    this.entityGfx    = this.add.graphics().setDepth(9);   // all cell bodies
    this.flagGfx      = this.add.graphics().setDepth(8);   // flagella
    this.organelleGfx = this.add.graphics().setDepth(11);  // gene organelles
    this.fxGfx        = this.add.graphics().setDepth(20);  // effects

    // ── NPC bacteria ──
    this.npcCells = [];
    this._spawnNPCs(5);

    // ── Predator (also invisible, drawn as graphics) ──
    this.predator = this.physics.add.image(
      Phaser.Math.Between(500, WORLD_W - 500),
      Phaser.Math.Between(500, WORLD_H - 500),
      'phys'
    );
    this.predator.setAlpha(0).setCollideWorldBounds(true)
                 .setDamping(true).setDrag(0.95).setMaxVelocity(150).setDepth(8);
    this.predator.body.setCircle(55, -53, -53);

    this.daughters = [];

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(ZOOM);

    this._createHUD();
    this._setupKeyboard();
    this._setupTouch();

    this.physics.add.overlap(this.player, this.foodGroup, this._eatFood,     null, this);
    this.physics.add.overlap(this.player, this.geneGroup, this._collectGene, null, this);
    this.physics.add.overlap(this.player, this.predator,  this._engulf,      null, this);

    // state
    this.energy         = 100;
    this.activeGenes    = new Set();
    this.alive          = true;
    this.fissioning     = false;
    this.engulfing      = false;
    this.dying          = false;
    this.dyingPulse     = false;
    this.playerAlpha    = 1.0;
    this.temp           = 37;
    this.targetTemp     = 37;
    this.tempTimer      = 0;
    this.tempInterval   = 15000;
    this.flagPhase      = 0;
    this.flagSpeed      = 0;
    this.tumbling       = false;
    this.tumbleAngle    = 0;
    this.tumbleTimer    = 0;
    this.bacterioTimer  = 0;
    this.conjTarget     = null;
    this.conjTimer      = 0;
    this.conjDuration   = 1800;
    this.startTime      = this.time.now;
    this.killCount      = 0;
    this.touchFission   = false;
    this.touchBact      = false;
    this.touchConj      = false;
    this.fissionScale   = { x: 1, y: 1 };
  }

  update(time, delta) {
    if (!this.alive || this.dying) return;
    const dt = delta / 1000;

    if (!this.fissioning) {
      this._updateTemp(dt);
      this._updateEnergy(dt);
      this._handleMovement(delta, dt);
    }

    // Draw everything
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

    if (this.foodGroup.getLength() < 25) this._spawnFood(15);
  }

  // ── Draw all cell bodies ────────────────────────────────────
  _drawAllCells() {
    const g = this.entityGfx;
    const fg = this.flagGfx;
    const og = this.organelleGfx;
    const cellColor = this._getCellColor();
    const pa = this.playerAlpha;

    // Player rod
    const angle = this.player.rotation;
    drawBacteria(g,
      this.player.x, this.player.y,
      angle,
      17 * CELL_S * this.fissionScale.x,
      72 * CELL_S * this.fissionScale.y,
      cellColor, pa
    );
    this._drawOrganelles(og, this.player.x, this.player.y, angle, cellColor, pa, CELL_S);

    // Flagellum
    const backAngle = angle + Math.PI;
    this.flagPhase += 0.12 + this.flagSpeed * 0.18;
    const pRear = 78 * CELL_S;
    this._drawFlagellum(fg, this.player.x, this.player.y, angle, this.flagPhase, cellColor, pa, pRear);
    if (this.activeGenes.has('FLAGELLUM')) {
      this._drawFlagellum(fg, this.player.x, this.player.y, angle + 0.35, this.flagPhase + Math.PI, cellColor, pa, pRear);
    }

    // Predator
    drawPredator(g, this.predator.x, this.predator.y, 72, 58, 1.0);

    // Daughters
    this.daughters.forEach(d => {
      if (!d.active) return;
      const da = Phaser.Math.DegToRad(d.angle - 90);
      drawBacteria(g, d.x, d.y, da, 13 * CELL_S, 52 * CELL_S, COL.daughter, 1.0);
      this._drawFlagellum(fg, d.x, d.y, da, d.flagPhase, COL.daughter, 1.0, 58 * CELL_S);
    });

    // NPCs
    this.npcCells.forEach(npc => {
      if (!npc.active) return;
      const na = Phaser.Math.DegToRad(npc.angle - 90);
      drawBacteria(g, npc.x, npc.y, na, 13 * CELL_S, 52 * CELL_S, COL.npc, 1.0);
      this._drawFlagellum(fg, npc.x, npc.y, na, npc.flagPhase, COL.npc, 1.0, 58 * CELL_S);
    });
  }

  // ── Flagellum ──────────────────────────────────────────────
  _drawFlagellum(fg, px, py, baseAngle, phase, color, alpha, rearDist) {
    const len   = 55, segs = 22;
    const amp   = 5 + this.flagSpeed * 4;
    const perpX = Math.cos(baseAngle + Math.PI / 2);
    const perpY = Math.sin(baseAngle + Math.PI / 2);
    const backX = Math.cos(baseAngle + Math.PI);
    const backY = Math.sin(baseAngle + Math.PI);
    const sx = px + backX * rearDist, sy = py + backY * rearDist;

    for (const [lw, la] of [[6, 0.08], [1.5, 0.88]]) {
      fg.lineStyle(lw, color, la * alpha);
      fg.beginPath(); fg.moveTo(sx, sy);
      for (let i = 1; i <= segs; i++) {
        const t  = i / segs;
        const cx2 = sx + backX * len * t;
        const cy2 = sy + backY * len * t;
        const w   = Math.sin(phase + t * Math.PI * 3) * amp * (1 - t * 0.4);
        fg.lineTo(cx2 + perpX * w, cy2 + perpY * w);
      }
      fg.strokePath();
    }
  }

  // ── Gene organelle overlays ────────────────────────────────
  _drawOrganelles(og, px, py, angle, color, alpha, scale) {
    scale = scale || 1;
    if (this.activeGenes.size === 0) return;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const rot = (x, y) => ({ x: px + x*cos - y*sin, y: py + x*sin + y*cos });

    const s = scale;
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
      og.lineStyle(2.5, GENES.MEMBRANE.color, 0.25 * alpha);
      const segs = 24;
      for (let i = 0; i < segs; i++) {
        const a1 = (i / segs) * Math.PI * 2, a2 = ((i+1) / segs) * Math.PI * 2;
        const p1 = rot(Math.cos(a1)*22*s, Math.sin(a1)*86*s);
        const p2 = rot(Math.cos(a2)*22*s, Math.sin(a2)*86*s);
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

  // ── Cell colour ────────────────────────────────────────────
  _getCellColor() {
    if (this.activeGenes.size === 0) return COL.cell;
    let r = (COL.cell >> 16) & 0xff;
    let g = (COL.cell >> 8)  & 0xff;
    let b =  COL.cell & 0xff;
    this.activeGenes.forEach(key => {
      const c = GENES[key].color;
      r = Math.min(255, r + (((c >> 16) & 0xff) * 0.55)) | 0;
      g = Math.min(255, g + (((c >> 8)  & 0xff) * 0.55)) | 0;
      b = Math.min(255, b + ((c & 0xff)          * 0.55)) | 0;
    });
    return (r << 16) | (g << 8) | b;
  }

  // ── Temperature ────────────────────────────────────────────
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

  // ── Energy ─────────────────────────────────────────────────
  _updateEnergy(dt) {
    let drain = 1.0;
    if (this.activeGenes.has('FLAGELLUM')) drain += 0.1;
    const speed = Math.hypot(this.player.body.velocity.x, this.player.body.velocity.y);
    drain += speed * 0.003;
    const isHot  = this.temp > 42, isCold = this.temp < 30;
    if (isHot || isCold) drain *= (isHot ? this.activeGenes.has('HSP') : this.activeGenes.has('CSP')) ? 2 : 4;
    this.energy -= drain * dt;

    // low energy — pulse alpha
    if (this.energy < 30 && !this.dyingPulse) {
      this.dyingPulse = true;
      this._pulseLow();
    }
    if (this.energy <= 0) { this.energy = 0; this._implode(); }
  }

  _pulseLow() {
    if (!this.alive || this.dying) return;
    this.playerAlpha = this.playerAlpha > 0.6 ? 0.35 : 1.0;
    this.time.delayedCall(220, () => this._pulseLow());
  }

  // ── Movement ───────────────────────────────────────────────
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

  // ── Food + Gene ─────────────────────────────────────────────
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

  // ── NPC bacteria ───────────────────────────────────────────
  _spawnNPCs(n) {
    for (let i = 0; i < n; i++) {
      const x = Phaser.Math.Between(300, WORLD_W - 300);
      const y = Phaser.Math.Between(300, WORLD_H - 300);
      const npc = this.physics.add.image(x, y, 'phys');
      npc.setAlpha(0).setCollideWorldBounds(true).setDamping(true).setDrag(0.93).setMaxVelocity(140).setDepth(10);
      npc.body.setCircle(16, -14, -14);
      npc.hp         = 2;
      npc.genes      = new Set();
      const shuffled = Phaser.Utils.Array.Shuffle([...GENE_KEYS]);
      npc.genes.add(shuffled[0]);
      if (Math.random() < 0.5) npc.genes.add(shuffled[1]);
      npc.wanderDir   = Math.random() * Math.PI * 2;
      npc.wanderTimer = 0;
      npc.flagPhase   = Math.random() * Math.PI * 2;
      npc.angle       = 0;
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
        this.tweens.add({ targets: g, y: gy - 6, duration: 1400 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      });
    }
    this.killCount++;
    // death flash
    const flash = this.add.graphics().setDepth(22);
    flash.lineStyle(3, 0xffffff, 0.8); flash.strokeCircle(cx, cy, 22);
    this.tweens.add({ targets: flash, alpha: 0, scaleX: 2.5, scaleY: 2.5, duration: 350, onComplete: () => flash.destroy() });
    cell.destroy();
  }

  // ── Bacteriocin ────────────────────────────────────────────
  _fireBacteriocin() {
    if (this.bacterioTimer > 0 || this.energy < 30) return;
    this.energy -= 30; this.bacterioTimer = 5000;
    const range = this.activeGenes.has('TOXIN') ? 210 : 140;
    const px = this.player.x, py = this.player.y;
    const ring = this.add.graphics().setDepth(18);
    ring.lineStyle(3, COL.bacterio, 1.0); ring.strokeCircle(px, py, 10);
    this.tweens.add({ targets: ring, scaleX: range/10, scaleY: range/10, alpha: 0, duration: 440, ease: 'Power2', onComplete: () => ring.destroy() });
    [...this.npcCells, ...this.daughters].forEach(c => {
      if (c.active && Phaser.Math.Distance.Between(px, py, c.x, c.y) < range) this._killCell(c);
    });
  }

  // ── Conjugation ────────────────────────────────────────────
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
    this.fxGfx.lineStyle(2, COL.pilus, 0.4 + Math.sin(t * Math.PI * 6) * 0.4);
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

  // ── Predator AI ────────────────────────────────────────────
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
    // pseudopods drawn inline when chasing
    if (dist < 200) this._drawPseudopods();
  }

  _drawPseudopods() {
    const g = this.entityGfx;
    for (let i = 0; i < 3; i++) {
      const ba = Math.atan2(this.player.y - this.predator.y, this.player.x - this.predator.x) + (i-1)*0.4;
      const len   = 48 + Math.sin(this.flagPhase*2 + i)*12;
      const perpX = Math.cos(ba + Math.PI/2), perpY = Math.sin(ba + Math.PI/2);
      g.lineStyle(2.5, COL.predator, 0.6);
      g.beginPath();
      g.moveTo(this.predator.x + Math.cos(ba)*55, this.predator.y + Math.sin(ba)*45);
      for (let s = 1; s <= 14; s++) {
        const t  = s / 14;
        const cx2 = this.predator.x + Math.cos(ba)*(55 + len*t);
        const cy2 = this.predator.y + Math.sin(ba)*(45 + len*t);
        const w   = Math.sin(this.flagPhase*1.5 + i*2 + t*Math.PI*2) * 4;
        g.lineTo(cx2 + perpX*w, cy2 + perpY*w);
      }
      g.strokePath();
    }
  }

  // ── Engulf → lysis ─────────────────────────────────────────
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

  // ── Lysis death ────────────────────────────────────────────
  _lyse(reason) {
    if (!this.alive || this.dying) return;
    this.alive = false; this.dying = true;
    this.player.body.setVelocity(0, 0).setAcceleration(0, 0);
    const px = this.player.x, py = this.player.y;
    const color = this._getCellColor();
    this.playerAlpha = 0;

    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const frag = this.add.graphics().setDepth(22).setPosition(px, py);
      const fa = a + (Math.random() - 0.5) * 0.5;
      frag.lineStyle(2, color, 0.9);
      frag.beginPath(); frag.arc(0, 0, 14 + Math.random()*10, fa, fa + 0.7, false); frag.strokePath();
      frag.fillStyle(color, 0.55); frag.fillCircle(Math.cos(fa)*8, Math.sin(fa)*8, 2);
      const dist2 = 65 + Math.random() * 40;
      this.tweens.add({ targets: frag, x: px + Math.cos(a)*dist2, y: py + Math.sin(a)*dist2, alpha: 0, duration: 680 + Math.random()*250, ease: 'Power2', onComplete: () => frag.destroy() });
    }
    this.time.delayedCall(800, () => this._showGameOver(reason));
  }

  // ── Implosion death ────────────────────────────────────────
  _implode() {
    if (!this.alive || this.dying) return;
    this.alive = false; this.dying = true;
    this.player.body.setVelocity(0, 0).setAcceleration(0, 0);
    const px = this.player.x, py = this.player.y;
    const color = this._getCellColor();

    this.fissionScale = { x: 1, y: 1 };
    const shrinkInterval = this.time.addEvent({
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

  // ── Fission ────────────────────────────────────────────────
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

  // ── Daughters ──────────────────────────────────────────────
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

  // ── Env tint ───────────────────────────────────────────────
  _updateEnvTint() {
    const t = this.temp;
    if (t > 42) {
      const i = Math.min((t-42)/28, 1) * 0.22;
      this.cameras.main.setBackgroundColor(Phaser.Display.Color.GetColor(Math.floor(i*90), 0, 8));
    } else if (t < 30) {
      const i = Math.min((30-t)/20, 1) * 0.22;
      this.cameras.main.setBackgroundColor(Phaser.Display.Color.GetColor(0, 0, Math.floor(8+i*90)));
    } else {
      this.cameras.main.setBackgroundColor(0x000008);
    }
  }

  // ── HUD ────────────────────────────────────────────────────
  _createHUD() {
    const w = this.cameras.main.width, h = this.cameras.main.height;
    this.hudCon = this.add.container(0, 0).setScrollFactor(0).setDepth(100);

    // Energy: thin bar, top of screen full-width (subtle)
    this.energyBarBg = this.add.graphics();
    this.energyBarBg.fillStyle(0x112211, 0.5); this.energyBarBg.fillRect(0, 0, w, 6);
    this.hudCon.add(this.energyBarBg);

    this.energyBar = this.add.graphics();
    this.hudCon.add(this.energyBar);

    // Temp: small colored text, top right
    this.tempText = this.add.text(w - 10, 10, '37°C', {
      fontSize: '12px', fill: '#33aa33', fontFamily: 'monospace'
    }).setOrigin(1, 0);
    this.hudCon.add(this.tempText);

    // Time + kills: top left, small
    this.scoreText = this.add.text(10, 10, '0s', {
      fontSize: '12px', fill: '#33aa33', fontFamily: 'monospace'
    });
    this.hudCon.add(this.scoreText);

    // Gene slots: bottom center
    this.geneSlots = [];
    for (let i = 0; i < 3; i++) {
      const sx = w/2 - 44 + i * 44, sy = h - 38;
      const bg = this.add.graphics();
      bg.lineStyle(1, 0x224422, 0.7); bg.strokeRect(sx-16, sy-16, 32, 32);
      this.hudCon.add(bg);
      const lbl = this.add.text(sx, sy, '', {
        fontSize: '14px', fill: '#aaffaa', fontFamily: 'monospace'
      }).setOrigin(0.5, 0.5);
      this.hudCon.add(lbl);
      this.geneSlots.push({ bg, lbl, sx, sy });
    }

    // Fission ready: subtle, centre bottom
    this.fissText = this.add.text(w/2, h - 72, 'F: FISSION READY', {
      fontSize: '9px', fill: '#00ff66', fontFamily: 'monospace'
    }).setOrigin(0.5).setAlpha(0);
    this.hudCon.add(this.fissText);

    // Bact cooldown: bottom left
    this.bactText = this.add.text(10, h - 18, '', {
      fontSize: '9px', fill: '#ff88aa', fontFamily: 'monospace'
    });
    this.hudCon.add(this.bactText);

    // Conjugate hint: bottom right
    this.conjHint = this.add.text(w - 10, h - 18, '', {
      fontSize: '9px', fill: '#ffff88', fontFamily: 'monospace', align: 'right'
    }).setOrigin(1, 0);
    this.hudCon.add(this.conjHint);

    this._buildActionButtons(w, h);
  }

  _buildActionButtons(w, h) {
    // Drawn circles with letter labels — no emoji
    const btns = [
      { label: 'F', y: h-150, key: 'touchFission', color: 0x00ff66 },
      { label: 'B', y: h-100, key: 'touchBact',    color: 0xff88aa },
      { label: 'C', y: h-50,  key: 'touchConj',    color: 0xffff88 },
    ];
    btns.forEach(b => {
      const hexStr = '#' + b.color.toString(16).padStart(6, '0');
      const btn = this.add.text(w - 28, b.y, b.label, {
        fontSize: '13px', fill: hexStr, fontFamily: 'monospace'
      }).setScrollFactor(0).setDepth(200).setOrigin(0.5).setAlpha(0.3).setInteractive({ useHandCursor: false });
      // draw a circle around it
      const circ = this.add.graphics().setScrollFactor(0).setDepth(199);
      circ.lineStyle(1, b.color, 0.3); circ.strokeCircle(w - 28, b.y, 16);
      this.hudCon.add(circ);
      btn.on('pointerdown', () => { this[b.key] = true;  btn.setAlpha(1.0); });
      btn.on('pointerup',   () => { this[b.key] = false; btn.setAlpha(0.3); });
      btn.on('pointerout',  () => { this[b.key] = false; btn.setAlpha(0.3); });
      this.hudCon.add(btn);
    });

    // Tumble: left side
    const tumbleColor = 0xaabbcc;
    const tcirc = this.add.graphics().setScrollFactor(0).setDepth(199);
    tcirc.lineStyle(1, tumbleColor, 0.3); tcirc.strokeCircle(28, h-130, 16);
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
    const w = this.cameras.main.width;
    const pct   = Math.min(this.energy / 200, 1);
    const color = this.energy > 150 ? 0x00ff66 : this.energy > 50 ? 0x00cc44 : 0xff4444;
    this.energyBar.clear();
    this.energyBar.fillStyle(color, 0.8);
    this.energyBar.fillRect(0, 0, Math.floor(w * pct), 6);

    const tc = this.temp > 50 ? '#ff5522' : this.temp < 25 ? '#55aaff' : '#33aa33';
    this.tempText.setText(`${Math.round(this.temp)}°C`).setStyle({ fill: tc });

    const sec = Math.floor((time - this.startTime) / 1000);
    this.scoreText.setText(`${sec}s  ${this.killCount > 0 ? this.killCount + ' kills' : ''}`);

    this.fissText.setAlpha(this.energy > 150 ? 0.8 : 0);
    this.bactText.setText(this.bacterioTimer > 0 ? `B ${Math.ceil(this.bacterioTimer/1000)}s` : 'B ready');

    const allFriendly = [...this.daughters, ...this.npcCells];
    const near = allFriendly.some(c => c.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y) < 140);
    this.conjHint.setText(this.conjTarget ? 'conjugating...' : near ? 'C conjugate' : '');

    this._updateGeneHUD();
  }

  _updateGeneHUD() {
    const gArr = Array.from(this.activeGenes);
    this.geneSlots.forEach((slot, i) => {
      const key = gArr[i];
      slot.lbl.setText(key ? GENES[key].symbol : '');
      slot.bg.clear();
      const col = key ? GENES[key].color : 0x224422;
      slot.bg.lineStyle(1, col, key ? 0.85 : 0.25);
      slot.bg.strokeRect(slot.sx - 16, slot.sy - 16, 32, 32);
      if (key) { slot.bg.fillStyle(col, 0.1); slot.bg.fillRect(slot.sx-16, slot.sy-16, 32, 32); }
      if (key) slot.lbl.setStyle({ fill: '#' + col.toString(16).padStart(6, '0') });
      else     slot.lbl.setStyle({ fill: '#aaffaa' });
    });
  }

  // ── Touch + Joystick ───────────────────────────────────────
  _setupTouch() {
    this.joystick = { active: false, baseX: 0, baseY: 0, stickX: 0, stickY: 0, radius: 65, dx: 0, dy: 0 };
    this.joystickGfx = this.add.graphics().setScrollFactor(0).setDepth(150);
    const RZ = this.cameras.main.width - 80;

    this.input.on('pointerdown', (p) => {
      if (p.x < RZ && !this.joystick.active) {
        this.joystick.active = true;
        this.joystick.baseX = p.x; this.joystick.baseY = p.y;
        this.joystick.stickX = p.x; this.joystick.stickY = p.y;
        this.joystick.dx = 0; this.joystick.dy = 0;
      }
    });
    this.input.on('pointermove', (p) => {
      if (!this.joystick.active) return;
      const dx = p.x - this.joystick.baseX, dy = p.y - this.joystick.baseY;
      const dist = Math.sqrt(dx*dx + dy*dy), a = Math.atan2(dy, dx);
      const cl = Math.min(dist, this.joystick.radius);
      this.joystick.stickX = this.joystick.baseX + Math.cos(a)*cl;
      this.joystick.stickY = this.joystick.baseY + Math.sin(a)*cl;
      this.joystick.dx = dist > 8 ? Math.cos(a) : 0;
      this.joystick.dy = dist > 8 ? Math.sin(a) : 0;
    });
    this.input.on('pointerup', () => {
      this.joystick.active = false; this.joystick.dx = 0; this.joystick.dy = 0;
    });
  }

  _drawJoystick() {
    this.joystickGfx.clear();
    if (!this.joystick.active) return;
    const { baseX, baseY, stickX, stickY, radius } = this.joystick;
    this.joystickGfx.lineStyle(1.5, 0xffffff, 0.14); this.joystickGfx.strokeCircle(baseX, baseY, radius);
    this.joystickGfx.lineStyle(1,   0xffffff, 0.08); this.joystickGfx.strokeCircle(baseX, baseY, radius*0.5);
    this.joystickGfx.fillStyle(COL.cell, 0.25);       this.joystickGfx.fillCircle(stickX, stickY, 20);
    this.joystickGfx.lineStyle(1.5, COL.cell, 0.45);  this.joystickGfx.strokeCircle(stickX, stickY, 20);
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

  // ── Background ─────────────────────────────────────────────
  _drawBackground() {
    // Very sparse faint dots — like looking through microscope at slide
    this.bgGfx.fillStyle(0x004422, 0.5);
    for (let i = 0; i < 800; i++) {
      const x = Phaser.Math.Between(0, WORLD_W);
      const y = Phaser.Math.Between(0, WORLD_H);
      const r = Math.random();
      if (r < 0.7) {
        this.bgGfx.fillCircle(x, y, 1);
      } else if (r < 0.9) {
        this.bgGfx.fillStyle(0x002211, 0.4); this.bgGfx.fillCircle(x, y, 2);
      } else {
        this.bgGfx.fillStyle(0x006644, 0.2); this.bgGfx.fillCircle(x, y, 3);
      }
    }
    // Orientation markers: very faint rings at world cardinal points
    this.bgGfx.lineStyle(0.5, 0x003322, 0.3);
    for (let r = 400; r < 1600; r += 400) {
      this.bgGfx.strokeCircle(WORLD_W/2, WORLD_H/2, r);
    }
  }

  // ── Spawning ───────────────────────────────────────────────
  _spawnFood(n) {
    for (let i = 0; i < n; i++) {
      this.foodGroup.create(Phaser.Math.Between(50, WORLD_W-50), Phaser.Math.Between(50, WORLD_H-50), 'food').setDepth(5);
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

  // ── Game over ──────────────────────────────────────────────
  _showGameOver(reason) {
    const elapsed = Math.floor((this.time.now - this.startTime) / 1000);
    const w = this.cameras.main.width, h = this.cameras.main.height;
    const ov = this.add.graphics().setScrollFactor(0).setDepth(200);
    ov.fillStyle(0x000000, 0.88); ov.fillRect(0, 0, w, h);

    this.add.text(w/2, h/2-55, reason || 'DEAD', {
      fontSize: '32px', fill: '#ff2244', fontFamily: 'monospace'
    }).setScrollFactor(0).setDepth(201).setOrigin(0.5);

    this.add.text(w/2, h/2, `${elapsed}s   ${this.killCount} kills`, {
      fontSize: '16px', fill: '#556655', fontFamily: 'monospace'
    }).setScrollFactor(0).setDepth(201).setOrigin(0.5);

    const rb = this.add.text(w/2, h/2+55, 'tap or any key', {
      fontSize: '12px', fill: '#00ff66', fontFamily: 'monospace'
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
  backgroundColor: '#000008',
  width:  window.innerWidth,
  height: window.innerHeight,
  physics: { default: 'arcade', arcade: { debug: false } },
  scene:   [BootScene, GameScene],
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH, parent: document.body },
};

const game = new Phaser.Game(config);
window.addEventListener('resize', () => game.scale.resize(window.innerWidth, window.innerHeight));
