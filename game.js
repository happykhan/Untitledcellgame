// ============================================================
//  Untitled Cell Game v2  —  Phaser 3, no build step
//  Bacillus protagonist, FISH fluorescence palette
// ============================================================

const WORLD_W = 3200;
const WORLD_H = 3200;

// FISH (Fluorescence In Situ Hybridisation) palette
const COL = {
  bg:        0x000008,  // near-black
  cell:      0x00ff66,  // FITC green
  flagellum: 0x00cc44,
  food:      0xff8800,  // Cy3 orange
  predator:  0xff2200,  // Texas Red
  gene:      0xffff00,
  npc:       0x4488ff,  // DAPI blue
  daughter:  0x88ffcc,
  bacterio:  0xff44aa,  // Cy5-like
  pilus:     0xffff55,
};

const GENES = {
  HSP:      { color: 0xff4400, symbol: 'H', desc: 'heat resist' },  // Texas Red
  CSP:      { color: 0x4488ff, symbol: 'C', desc: 'cold resist' },  // DAPI
  FLAGELLUM:{ color: 0xccff00, symbol: 'F', desc: '+speed'      },  // yellow-green
  MEMBRANE: { color: 0xff8800, symbol: 'M', desc: '+defense'    },  // Cy3
  TOXIN:    { color: 0xcc44ff, symbol: 'T', desc: '+bact range' },  // Cy5
};
const GENE_KEYS = Object.keys(GENES);

// ═══════════════════════════════════════════════════════════
//  BOOT — generate WHITE textures (tinted in-game for colour changes)
// ═══════════════════════════════════════════════════════════
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    // Player: rod-shaped Bacillus (portrait, 60×180)
    this._makeRod('cell',     60, 180, 30, 90, 17, 72);
    // Predator: large round eukaryote (180×150)
    this._makeBlob('predator', 180, 150, 90, 75, 72, 58);
    // NPC bacteria: smaller rod (50×140)
    this._makeRod('npc',      50, 140, 25, 70, 13, 52);
    // Daughter: same as NPC
    this._makeRod('daughter', 50, 140, 25, 70, 13, 52);
    this._makeFood();
    this._makeGenes();
    this.scene.start('Game');
  }

  _makeRod(key, tw, th, cx, cy, rx, ry) {
    const c = 0xffffff;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    // glow layers
    g.lineStyle(14, c, 0.05); g.strokeEllipse(cx, cy, rx*2+14, ry*2+14);
    g.lineStyle(7,  c, 0.13); g.strokeEllipse(cx, cy, rx*2+7,  ry*2+7);
    g.lineStyle(3,  c, 0.24); g.strokeEllipse(cx, cy, rx*2+3,  ry*2+3);
    // membrane
    g.lineStyle(2, c, 1.0);   g.strokeEllipse(cx, cy, rx*2,    ry*2);
    // nucleoid (elongated, bacterial)
    g.lineStyle(1.5, c, 0.5); g.strokeEllipse(cx, cy, rx*0.7,  ry*0.48);
    g.fillStyle(c, 0.15);     g.fillEllipse(cx,   cy, rx*0.65, ry*0.43);
    // cross-wall septum hint
    g.lineStyle(0.8, c, 0.18); g.lineBetween(cx - rx + 3, cy, cx + rx - 3, cy);
    // ribosomes
    g.fillStyle(c, 0.42);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.fillCircle(cx + Math.cos(a)*rx*0.6, cy + Math.sin(a)*ry*0.65, 2);
    }
    g.generateTexture(key, tw, th);
    g.destroy();
  }

  _makeBlob(key, tw, th, cx, cy, rx, ry) {
    const c = 0xffffff;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.lineStyle(16, c, 0.05); g.strokeEllipse(cx, cy, rx*2+16, ry*2+16);
    g.lineStyle(8,  c, 0.12); g.strokeEllipse(cx, cy, rx*2+8,  ry*2+8);
    g.lineStyle(4,  c, 0.22); g.strokeEllipse(cx, cy, rx*2+4,  ry*2+4);
    g.lineStyle(2.5, c, 1.0); g.strokeEllipse(cx, cy, rx*2,    ry*2);
    // nucleus (eukaryotic — round)
    g.lineStyle(2, c, 0.55);  g.strokeCircle(cx, cy, rx*0.3);
    g.fillStyle(c, 0.2);      g.fillCircle(cx, cy, rx*0.15);
    // organelles
    g.lineStyle(1, c, 0.3);
    g.strokeEllipse(cx + rx*0.42, cy - ry*0.22, rx*0.28, ry*0.18);
    g.strokeEllipse(cx - rx*0.38, cy + ry*0.28, rx*0.26, ry*0.17);
    g.fillStyle(c, 0.38);
    for (let i = 0; i < 10; i++) {
      const a = (i/10)*Math.PI*2 + 0.3;
      g.fillCircle(cx + Math.cos(a)*rx*0.58, cy + Math.sin(a)*ry*0.56, 2.2);
    }
    g.generateTexture(key, tw, th);
    g.destroy();
  }

  _makeFood() {
    const c = 0xffffff;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.lineStyle(8,   c, 0.12); g.strokeCircle(14, 14, 10);
    g.lineStyle(4,   c, 0.28); g.strokeCircle(14, 14, 8);
    g.lineStyle(1.5, c, 1.0);  g.strokeCircle(14, 14, 6);
    g.fillStyle(c, 0.28);      g.fillCircle(14, 14, 5);
    g.fillStyle(c, 0.7);       g.fillCircle(14, 14, 1.5);
    g.generateTexture('food', 28, 28);
    g.destroy();
  }

  _makeGenes() {
    GENE_KEYS.forEach(key => {
      const c = 0xffffff;
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.lineStyle(12, c, 0.1);  g.strokeCircle(18, 18, 16);
      g.lineStyle(6,  c, 0.22); g.strokeCircle(18, 18, 13);
      g.lineStyle(2,  c, 1.0);  g.strokeCircle(18, 18, 11);
      for (let i = 0; i <= 10; i++) {
        const t  = i / 10;
        const x  = 8 + t * 20;
        const y1 = 18 + Math.sin(t * Math.PI * 2.5) * 7;
        const y2 = 18 - Math.sin(t * Math.PI * 2.5) * 7;
        g.fillStyle(c, 0.9); g.fillCircle(x, y1, 1.8); g.fillCircle(x, y2, 1.8);
      }
      g.generateTexture('gene_' + key, 36, 36);
      g.destroy();
    });
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

    this.bgGraphics = this.add.graphics();
    this._drawDotField();

    this.foodGroup = this.physics.add.staticGroup();
    this._spawnFood(50);
    this.geneGroup = this.physics.add.staticGroup();
    this._spawnGenes(15);

    // Player: rod Bacillus, white texture, tinted to COL.cell
    this.player = this.physics.add.image(WORLD_W / 2, WORLD_H / 2, 'cell');
    this.player.setCollideWorldBounds(true)
               .setDamping(true).setDrag(0.90).setMaxVelocity(340).setDepth(10)
               .setTint(COL.cell);

    this.flagGraphics    = this.add.graphics().setDepth(9);
    this.organelleGraphics = this.add.graphics().setDepth(11);
    this.fxGraphics      = this.add.graphics().setDepth(20);

    // NPC bacteria
    this.npcCells = [];
    this._spawnNPCs(5);

    // Predator
    this.predator = this.physics.add.image(
      Phaser.Math.Between(500, WORLD_W - 500),
      Phaser.Math.Between(500, WORLD_H - 500),
      'predator'
    );
    this.predator.setCollideWorldBounds(true)
                 .setDamping(true).setDrag(0.95).setMaxVelocity(150).setDepth(8)
                 .setTint(COL.predator);
    this.pseudopodGfx = this.add.graphics().setDepth(7);

    this.daughters = [];
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

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
  }

  // ──────────────────────────────────────────────────────────
  update(time, delta) {
    if (!this.alive || this.dying || this.fissioning) return;
    const dt = delta / 1000;

    this._updateTemp(dt);
    this._updateEnergy(dt);
    this._handleMovement(delta, dt);
    this._drawFlagellum();
    this._drawOrganelles();
    this._updatePredator(delta);
    this._updateDaughters(delta);
    this._updateNPCs(delta);
    this._updateConjugation(delta);
    this._drawJoystick();
    this._updateHUD(time);
    this._updateEnvTint();

    if (this.bacterioTimer > 0) this.bacterioTimer -= delta;

    if (this.energy > 150 && (Phaser.Input.Keyboard.JustDown(this.wasd.fiss) || this.touchFission)) {
      this.touchFission = false;
      this._triggerFission();
    }
    if (Phaser.Input.Keyboard.JustDown(this.wasd.bact) || this.touchBact) {
      this.touchBact = false;
      this._fireBacteriocin();
    }
    if (Phaser.Input.Keyboard.JustDown(this.wasd.conj) || this.touchConj) {
      this.touchConj = false;
      this._startConjugation();
    }
    if (this.foodGroup.getLength() < 25) this._spawnFood(15);
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

  // ── Energy — faster drain at speed ─────────────────────────
  _updateEnergy(dt) {
    let drain = 1.0;
    if (this.activeGenes.has('FLAGELLUM')) drain += 0.1;

    // movement cost
    const speed = Math.hypot(this.player.body.velocity.x, this.player.body.velocity.y);
    drain += speed * 0.003;  // at max speed (340) ~+1.0 extra drain/sec

    const isHot  = this.temp > 42;
    const isCold = this.temp < 30;
    if (isHot || isCold) {
      const adapted = isHot ? this.activeGenes.has('HSP') : this.activeGenes.has('CSP');
      drain *= adapted ? 2 : 4;
    }

    this.energy -= drain * dt;

    // low energy: slight visual pulse
    if (this.energy < 30 && !this.dyingPulse) {
      this.dyingPulse = true;
      this.tweens.add({ targets: this.player, alpha: 0.4, duration: 200, yoyo: true, repeat: -1 });
    }

    if (this.energy <= 0) {
      this.energy = 0;
      this._implode();
    }
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

    // Joystick priority
    if (this.joystick.active &&
        (Math.abs(this.joystick.dx) > 0.1 || Math.abs(this.joystick.dy) > 0.1)) {
      this.player.body.setAcceleration(
        this.joystick.dx * baseSpeed * 2.2,
        this.joystick.dy * baseSpeed * 2.2
      );
      this.player.rotation = Math.atan2(this.joystick.dy, this.joystick.dx) + Math.PI / 2;
      this.flagSpeed = 1.0;
      return;
    }

    // Keyboard
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

  // ── Flagellum ──────────────────────────────────────────────
  _drawFlagellum() {
    this.flagGraphics.clear();
    this.flagPhase += 0.12 + this.flagSpeed * 0.18;
    const angle = Phaser.Math.DegToRad(this.player.angle - 90);
    const cellColor = this._getCellColor();
    this._drawOneFlagellum(this.player.x, this.player.y, angle, this.flagPhase, cellColor, 78);
    if (this.activeGenes.has('FLAGELLUM')) {
      this._drawOneFlagellum(this.player.x, this.player.y, angle + 0.35, this.flagPhase + Math.PI, cellColor, 78);
    }
  }

  _drawOneFlagellum(px, py, baseAngle, phase, color, rearDist) {
    const dist = rearDist || 30;
    const len   = 55, segs = 22;
    const amp   = 5 + this.flagSpeed * 4;
    const perpX = Math.cos(baseAngle + Math.PI / 2);
    const perpY = Math.sin(baseAngle + Math.PI / 2);
    const backX = Math.cos(baseAngle + Math.PI);
    const backY = Math.sin(baseAngle + Math.PI);
    const sx = px + backX * dist, sy = py + backY * dist;

    for (const [lw, a] of [[5, 0.1], [1.5, 0.9]]) {
      this.flagGraphics.lineStyle(lw, color, a);
      this.flagGraphics.beginPath();
      this.flagGraphics.moveTo(sx, sy);
      for (let i = 1; i <= segs; i++) {
        const t  = i / segs;
        const cx = sx + backX * len * t;
        const cy = sy + backY * len * t;
        const w  = Math.sin(phase + t * Math.PI * 3) * amp * (1 - t * 0.4);
        this.flagGraphics.lineTo(cx + perpX * w, cy + perpY * w);
      }
      this.flagGraphics.strokePath();
    }
  }

  // ── Organelle overlay — changes with genes ─────────────────
  _drawOrganelles() {
    this.organelleGraphics.clear();
    if (this.activeGenes.size === 0) return;

    const px = this.player.x, py = this.player.y;
    const angle = this.player.rotation;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const rot = (x, y) => ({ x: px + x * cos - y * sin, y: py + x * sin + y * cos });

    if (this.activeGenes.has('HSP')) {
      // Heat shock protein aggregates: orange dots near poles
      this.organelleGraphics.fillStyle(GENES.HSP.color, 0.75);
      [[-4, -44], [4, -44], [-4, 44], [4, 44], [0, -30], [0, 30]].forEach(([x, y]) => {
        const p = rot(x, y); this.organelleGraphics.fillCircle(p.x, p.y, 2.5);
      });
    }
    if (this.activeGenes.has('CSP')) {
      // Cold shock proteins: blue ribosome clusters
      this.organelleGraphics.fillStyle(GENES.CSP.color, 0.65);
      for (let i = -3; i <= 3; i++) {
        const p = rot(0, i * 16); this.organelleGraphics.fillCircle(p.x, p.y, 2.5);
      }
    }
    if (this.activeGenes.has('FLAGELLUM')) {
      // Extra gene: elongated nucleoid line
      this.organelleGraphics.lineStyle(1.5, GENES.FLAGELLUM.color, 0.55);
      const a = rot(0, -28), b2 = rot(0, 28);
      this.organelleGraphics.lineBetween(a.x, a.y, b2.x, b2.y);
    }
    if (this.activeGenes.has('MEMBRANE')) {
      // Thick membrane: extra ellipse ring outside the cell
      this.organelleGraphics.lineStyle(2.5, GENES.MEMBRANE.color, 0.28);
      const segs = 24;
      for (let i = 0; i < segs; i++) {
        const a1 = (i / segs) * Math.PI * 2, a2 = ((i + 1) / segs) * Math.PI * 2;
        const p1 = rot(Math.cos(a1) * 22, Math.sin(a1) * 84);
        const p2 = rot(Math.cos(a2) * 22, Math.sin(a2) * 84);
        this.organelleGraphics.lineBetween(p1.x, p1.y, p2.x, p2.y);
      }
    }
    if (this.activeGenes.has('TOXIN')) {
      // Toxin: inclusion vesicles (small circles inside)
      this.organelleGraphics.lineStyle(1.5, GENES.TOXIN.color, 0.7);
      [[6, 0], [-6, 18], [6, -18]].forEach(([x, y]) => {
        const p = rot(x, y); this.organelleGraphics.strokeCircle(p.x, p.y, 4);
      });
    }
  }

  // ── Cell colour helpers ────────────────────────────────────
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

  _refreshCellTint() {
    this.player.setTint(this._getCellColor());
  }

  // ── Food / Gene pickup ─────────────────────────────────────
  _eatFood(player, food) {
    food.destroy();
    this.energy = Math.min(200, this.energy + 22);
    this.tweens.add({ targets: player, alpha: 0.6, duration: 60, yoyo: true });
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
    this._refreshCellTint();
    this._updateGeneHUD();
    // brief flash in gene colour
    this.cameras.main.flash(200, (GENES[key].color >> 16) & 0xff,
                                  (GENES[key].color >> 8)  & 0xff,
                                   GENES[key].color & 0xff, true);
  }

  // ── NPC bacteria ───────────────────────────────────────────
  _spawnNPCs(n) {
    for (let i = 0; i < n; i++) {
      const x = Phaser.Math.Between(300, WORLD_W - 300);
      const y = Phaser.Math.Between(300, WORLD_H - 300);
      const npc = this.physics.add.image(x, y, 'npc');
      npc.setCollideWorldBounds(true).setDamping(true).setDrag(0.93)
         .setMaxVelocity(140).setDepth(10).setTint(COL.npc);
      npc.hp         = 2;
      npc.genes      = new Set();
      const shuffled = Phaser.Utils.Array.Shuffle([...GENE_KEYS]);
      npc.genes.add(shuffled[0]);
      if (Math.random() < 0.5) npc.genes.add(shuffled[1]);
      npc.wanderDir   = Math.random() * Math.PI * 2;
      npc.wanderTimer = 0;
      npc.flagPhase   = Math.random() * Math.PI * 2;
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
      const angle = Phaser.Math.DegToRad(npc.angle - 90);
      this._drawOneFlagellum(npc.x, npc.y, angle, npc.flagPhase, COL.npc, 58);
    }
  }

  _collideNPC(npc) {
    if (!npc || !npc.active) return;
    const speed = Math.hypot(this.player.body.velocity.x, this.player.body.velocity.y);
    if (speed < 200) return;
    npc.hp--;
    this.tweens.add({ targets: npc, alpha: 0.2, duration: 80, yoyo: true });
    if (npc.hp <= 0) this._killCell(npc);
  }

  _killCell(cell) {
    if (!cell || !cell.active) return;
    const cx = cell.x, cy2 = cell.y;
    if (cell.genes) {
      cell.genes.forEach(key => {
        const g = this.geneGroup.create(
          cx + Phaser.Math.Between(-28, 28),
          cy2 + Phaser.Math.Between(-28, 28),
          'gene_' + key
        ).setDepth(6).setTint(GENES[key].color);
        g.setData('geneKey', key);
        this.tweens.add({ targets: g, y: g.y - 6, duration: 1400 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      });
    }
    this.killCount++;
    const flash = this.add.graphics().setDepth(22);
    flash.lineStyle(3, 0xffffff, 0.85);
    flash.strokeCircle(cx, cy2, 25);
    this.tweens.add({ targets: flash, alpha: 0, scaleX: 2.5, scaleY: 2.5, duration: 350, onComplete: () => flash.destroy() });
    cell.destroy();
  }

  // ── Bacteriocin ────────────────────────────────────────────
  _fireBacteriocin() {
    if (this.bacterioTimer > 0 || this.energy < 30) return;
    this.energy       -= 30;
    this.bacterioTimer = 5000;

    const range = this.activeGenes.has('TOXIN') ? 210 : 140;
    const px = this.player.x, py = this.player.y;

    const ring = this.add.graphics().setDepth(18);
    ring.lineStyle(3, COL.bacterio, 1.0);
    ring.strokeCircle(px, py, 10);
    this.tweens.add({
      targets: ring, scaleX: range / 10, scaleY: range / 10, alpha: 0,
      duration: 440, ease: 'Power2',
      onComplete: () => ring.destroy()
    });

    [...this.npcCells, ...this.daughters].forEach(c => {
      if (!c.active) return;
      if (Phaser.Math.Distance.Between(px, py, c.x, c.y) < range) this._killCell(c);
    });
  }

  // ── Conjugation ────────────────────────────────────────────
  _startConjugation() {
    if (this.conjTarget) return;
    const candidates = [...this.daughters, ...this.npcCells]
      .filter(c => c.active && c.genes && c.genes.size > 0);
    let nearest = null, nearDist = 140;
    candidates.forEach(c => {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y);
      if (d < nearDist) { nearDist = d; nearest = c; }
    });
    if (!nearest) return;
    this.conjTarget = nearest;
    this.conjTimer  = 0;
  }

  _updateConjugation(delta) {
    if (!this.conjTarget) return;
    if (!this.conjTarget.active) { this.conjTarget = null; this.fxGraphics.clear(); return; }

    this.conjTimer += delta;
    const t = this.conjTimer / this.conjDuration;

    this.fxGraphics.clear();
    this.fxGraphics.lineStyle(2, COL.pilus, 0.45 + Math.sin(t * Math.PI * 6) * 0.4);
    this.fxGraphics.lineBetween(this.player.x, this.player.y, this.conjTarget.x, this.conjTarget.y);

    if (this.conjTimer >= this.conjDuration) {
      this.fxGraphics.clear();
      const geneArr = Array.from(this.conjTarget.genes);
      if (geneArr.length > 0 && this.activeGenes.size < 3) {
        const key = geneArr[Math.floor(Math.random() * geneArr.length)];
        if (!this.activeGenes.has(key)) {
          this.activeGenes.add(key);
          this.conjTarget.genes.delete(key);
          this._refreshCellTint();
          this._updateGeneHUD();
          this.tweens.add({ targets: this.player, alpha: 0.35, duration: 120, yoyo: true, repeat: 1 });
        }
      }
      this.conjTarget = null;
    }
  }

  // ── Predator ───────────────────────────────────────────────
  _updatePredator(delta) {
    const dist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.predator.x, this.predator.y
    );
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
    this.pseudopodGfx.clear();
    if (dist < 200) this._drawPseudopods();
  }

  _drawPseudopods() {
    for (let i = 0; i < 3; i++) {
      const ba = Math.atan2(
        this.player.y - this.predator.y,
        this.player.x - this.predator.x
      ) + (i - 1) * 0.4;
      const len   = 48 + Math.sin(this.flagPhase * 2 + i) * 12;
      const perpX = Math.cos(ba + Math.PI / 2);
      const perpY = Math.sin(ba + Math.PI / 2);
      this.pseudopodGfx.lineStyle(2.5, COL.predator, 0.65);
      this.pseudopodGfx.beginPath();
      this.pseudopodGfx.moveTo(this.predator.x + Math.cos(ba) * 52, this.predator.y + Math.sin(ba) * 42);
      for (let s = 1; s <= 15; s++) {
        const t  = s / 15;
        const cx = this.predator.x + Math.cos(ba) * (52 + len * t);
        const cy = this.predator.y + Math.sin(ba) * (42 + len * t);
        const w  = Math.sin(this.flagPhase * 1.5 + i * 2 + t * Math.PI * 2) * 4;
        this.pseudopodGfx.lineTo(cx + perpX * w, cy + perpY * w);
      }
      this.pseudopodGfx.strokePath();
    }
  }

  // ── Engulf → lysis ─────────────────────────────────────────
  _engulf() {
    if (this.engulfing || this.fissioning || this.dying) return;
    this.engulfing = true;
    const hasMembrane = this.activeGenes.has('MEMBRANE');

    if (hasMembrane) {
      // Membrane resists — struggle animation, then die anyway
      this.tweens.add({
        targets: this.player, scaleX: 1.3, scaleY: 0.7, duration: 150, yoyo: true, repeat: 6,
        onComplete: () => { if (this.alive) this._lyse('LYSED BY PREDATOR'); }
      });
    } else {
      this._lyse('LYSED BY PREDATOR');
    }
  }

  // ── Death: lysis (predator) ─────────────────────────────────
  _lyse(reason) {
    if (!this.alive || this.dying) return;
    this.alive  = false;
    this.dying  = true;
    this.player.body.setVelocity(0, 0).setAcceleration(0, 0);

    const px = this.player.x, py = this.player.y;
    const cellColor = this._getCellColor();

    this.player.setAlpha(0);

    // membrane fragments fly outward
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const frag = this.add.graphics().setDepth(22);
      frag.setPosition(px, py);
      const fa = a + (Math.random() - 0.5) * 0.5;
      frag.lineStyle(2, cellColor, 0.9);
      frag.beginPath();
      frag.arc(0, 0, 16 + Math.random() * 10, fa, fa + 0.65, false);
      frag.strokePath();
      frag.fillStyle(cellColor, 0.5);
      frag.fillCircle(Math.cos(fa) * 8, Math.sin(fa) * 8, 2);
      const dist2 = 65 + Math.random() * 40;
      this.tweens.add({
        targets: frag,
        x: px + Math.cos(a) * dist2, y: py + Math.sin(a) * dist2,
        alpha: 0, duration: 650 + Math.random() * 250, ease: 'Power2',
        onComplete: () => frag.destroy()
      });
    }

    this.time.delayedCall(780, () => this._showGameOver(reason));
  }

  // ── Death: implosion (starvation) ──────────────────────────
  _implode() {
    if (!this.alive || this.dying) return;
    this.alive = false;
    this.dying = true;
    this.player.body.setVelocity(0, 0).setAcceleration(0, 0);

    const px = this.player.x, py = this.player.y;
    const cellColor = this._getCellColor();

    this.tweens.killTweensOf(this.player);
    this.tweens.add({
      targets: this.player, scaleX: 0.05, scaleY: 0.05, alpha: 0,
      duration: 700, ease: 'Back.easeIn',
    });

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const frag = this.add.graphics().setDepth(22);
      frag.fillStyle(cellColor, 0.75);
      frag.fillCircle(0, 0, 3);
      frag.setPosition(px + Math.cos(a) * 55, py + Math.sin(a) * 55);
      this.tweens.add({
        targets: frag, x: px, y: py, alpha: 0,
        duration: 480, ease: 'Power2',
        onComplete: () => frag.destroy()
      });
    }

    this.time.delayedCall(740, () => this._showGameOver('ENERGY DEPLETED'));
  }

  // ── Fission ────────────────────────────────────────────────
  _triggerFission() {
    if (this.fissioning) return;
    this.fissioning = true;
    this.tweens.add({
      targets: this.player, scaleX: 0.6, scaleY: 1.5, duration: 400,
      onComplete: () => this._completeFission()
    });
  }

  _completeFission() {
    const dx = Phaser.Math.Between(-55, 55), dy = Phaser.Math.Between(-55, 55);
    const d  = this.physics.add.image(this.player.x + dx, this.player.y + dy, 'daughter');
    d.setCollideWorldBounds(true).setDamping(true).setDrag(0.93)
     .setMaxVelocity(200).setDepth(10).setTint(COL.daughter);
    d.hp          = 3;
    d.genes       = new Set(this.activeGenes);
    d.wanderDir   = Math.random() * Math.PI * 2;
    d.wanderTimer = 0;
    d.flagPhase   = 0;
    this.daughters.push(d);

    const a = Math.atan2(dy, dx);
    d.body.setVelocity(Math.cos(a) * 120, Math.sin(a) * 120);
    this.player.body.setVelocity(-Math.cos(a) * 80, -Math.sin(a) * 80);
    this.physics.add.overlap(this.player, d, () => this._collideNPC(d), null, this);

    this.player.setScale(1, 1);
    this.player.angle  = 0;
    this.energy        = 80;
    this.activeGenes   = new Set();
    this.dyingPulse    = false;
    this.tweens.killTweensOf(this.player);
    this.player.setAlpha(1);
    this.fissioning    = false;
    this._refreshCellTint();
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
        d.body.setVelocity(Math.cos(d.wanderDir) * 80, Math.sin(d.wanderDir) * 80);
      }
      d.angle     = Phaser.Math.RadToDeg(d.wanderDir) + 90;
      d.flagPhase += 0.1;
      const angle = Phaser.Math.DegToRad(d.angle - 90);
      this._drawOneFlagellum(d.x, d.y, angle, d.flagPhase, COL.daughter, 58);
    }
  }

  // ── Env tint ───────────────────────────────────────────────
  _updateEnvTint() {
    const t = this.temp;
    if (t > 42) {
      const i = Math.min((t - 42) / 28, 1) * 0.22;
      this.cameras.main.setBackgroundColor(
        Phaser.Display.Color.GetColor(Math.floor(i * 90), 0, Math.floor(8 - i * 8))
      );
    } else if (t < 30) {
      const i = Math.min((30 - t) / 20, 1) * 0.22;
      this.cameras.main.setBackgroundColor(
        Phaser.Display.Color.GetColor(0, 0, Math.floor(8 + i * 90))
      );
    } else {
      this.cameras.main.setBackgroundColor(0x000008);
    }
  }

  // ── HUD ────────────────────────────────────────────────────
  _createHUD() {
    const w = this.cameras.main.width, h = this.cameras.main.height;
    this.hudCon = this.add.container(0, 0).setScrollFactor(0).setDepth(100);

    const ebg = this.add.graphics();
    ebg.lineStyle(1, 0x224422, 1); ebg.strokeRect(12, 14, 160, 12);
    this.hudCon.add(ebg);
    this.energyBar = this.add.graphics(); this.hudCon.add(this.energyBar);
    this.hudCon.add(this.add.text(12, 30, 'ENERGY', { fontSize: '9px', fill: '#557755', fontFamily: 'monospace' }));

    this.tempText = this.add.text(w - 12, 14, '', {
      fontSize: '11px', fill: '#aabbcc', fontFamily: 'monospace', align: 'right'
    }).setOrigin(1, 0);
    this.hudCon.add(this.tempText);

    this.scoreText = this.add.text(w / 2, 14, '', {
      fontSize: '11px', fill: '#aabbcc', fontFamily: 'monospace', align: 'center'
    }).setOrigin(0.5, 0);
    this.hudCon.add(this.scoreText);

    this.geneSlots = [];
    for (let i = 0; i < 3; i++) {
      const sx = w / 2 - 50 + i * 50, sy = h - 52;
      const bg = this.add.graphics();
      bg.lineStyle(1, 0x224422, 1); bg.strokeRect(sx - 16, sy - 16, 32, 32);
      this.hudCon.add(bg);
      const lbl = this.add.text(sx, sy + 18, '', {
        fontSize: '8px', fill: '#aaffaa', fontFamily: 'monospace', align: 'center'
      }).setOrigin(0.5, 0);
      this.hudCon.add(lbl);
      this.geneSlots.push({ bg, lbl, sx, sy });
    }

    this.fissIndicator = this.add.text(w / 2, h - 86, 'F: FISSION READY', {
      fontSize: '10px', fill: '#00ff88', fontFamily: 'monospace'
    }).setOrigin(0.5).setAlpha(0);
    this.hudCon.add(this.fissIndicator);

    this.bacterioText = this.add.text(12, h - 18, '', {
      fontSize: '9px', fill: '#ff88aa', fontFamily: 'monospace'
    });
    this.hudCon.add(this.bacterioText);

    this.conjText = this.add.text(w - 12, h - 18, '', {
      fontSize: '9px', fill: '#ffff88', fontFamily: 'monospace', align: 'right'
    }).setOrigin(1, 0);
    this.hudCon.add(this.conjText);

    this._buildActionButtons(w, h);
  }

  _buildActionButtons(w, h) {
    const acts = [
      { label: '⊕', y: h - 158, key: 'touchFission', color: '#00ff88' },
      { label: '💥', y: h - 100, key: 'touchBact',    color: '#ff88aa' },
      { label: '⟷', y: h - 42,  key: 'touchConj',    color: '#ffff88' },
    ];
    acts.forEach(b => {
      const btn = this.add.text(w - 28, b.y, b.label, {
        fontSize: '26px', fill: b.color, fontFamily: 'sans-serif'
      }).setScrollFactor(0).setDepth(200).setOrigin(0.5).setAlpha(0.28).setInteractive();
      btn.on('pointerdown', () => { this[b.key] = true;  btn.setAlpha(0.85); });
      btn.on('pointerup',   () => { this[b.key] = false; btn.setAlpha(0.28); });
      btn.on('pointerout',  () => { this[b.key] = false; btn.setAlpha(0.28); });
      this.hudCon.add(btn);
    });

    const tumbleBtn = this.add.text(52, h - 155, '↺', {
      fontSize: '28px', fill: '#aabbcc', fontFamily: 'sans-serif'
    }).setScrollFactor(0).setDepth(200).setOrigin(0.5).setAlpha(0.28).setInteractive();
    tumbleBtn.on('pointerdown', () => {
      tumbleBtn.setAlpha(0.85);
      if (!this.tumbling) {
        this.tumbling    = true;
        this.tumbleTimer = 400;
        this.tumbleAngle = (Math.random() < 0.5 ? -1 : 1) * (90 + Math.random() * 180);
        this.player.body.setAcceleration(0, 0);
      }
    });
    tumbleBtn.on('pointerup',  () => tumbleBtn.setAlpha(0.28));
    tumbleBtn.on('pointerout', () => tumbleBtn.setAlpha(0.28));
    this.hudCon.add(tumbleBtn);
  }

  _updateHUD(time) {
    const pct   = Math.min(this.energy / 200, 1);
    const color = this.energy > 150 ? 0x00ff88 : this.energy > 50 ? 0x00ff66 : 0xff4444;
    this.energyBar.clear();
    this.energyBar.fillStyle(color, 0.85);
    this.energyBar.fillRect(13, 15, Math.floor(158 * pct), 10);

    const tc = this.temp > 50 ? '#ff6633' : this.temp < 25 ? '#55aaff' : '#aabbcc';
    this.tempText.setText(`${Math.round(this.temp)}°C`).setStyle({ fill: tc });

    const sec = Math.floor((time - this.startTime) / 1000);
    this.scoreText.setText(`${sec}s  ${this.killCount} kills`);

    this.fissIndicator.setAlpha(this.energy > 150 ? 1 : 0);
    this.bacterioText.setText(
      this.bacterioTimer > 0 ? `BACT ${Math.ceil(this.bacterioTimer / 1000)}s` : 'B: BACT'
    );

    const allFriendly = [...this.daughters, ...this.npcCells];
    const near = allFriendly.some(c => c.active &&
      Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y) < 140);
    this.conjText.setText(this.conjTarget ? 'CONJUGATING...' : near ? 'C: CONJUGATE' : '');

    this._updateGeneHUD();
  }

  _updateGeneHUD() {
    const gArr = Array.from(this.activeGenes);
    this.geneSlots.forEach((slot, i) => {
      const key = gArr[i];
      slot.lbl.setText(key ? GENES[key].symbol : '');
      slot.bg.clear();
      const col = key ? GENES[key].color : 0x224422;
      slot.bg.lineStyle(1, col, key ? 0.9 : 0.3);
      slot.bg.strokeRect(slot.sx - 16, slot.sy - 16, 32, 32);
      if (key) { slot.bg.fillStyle(col, 0.12); slot.bg.fillRect(slot.sx - 16, slot.sy - 16, 32, 32); }
    });
  }

  // ── Touch + Joystick ───────────────────────────────────────
  _setupTouch() {
    this.joystick = { active: false, baseX: 0, baseY: 0, stickX: 0, stickY: 0, radius: 65, dx: 0, dy: 0 };
    this.joystickGfx = this.add.graphics().setScrollFactor(0).setDepth(150);

    const RZ = this.cameras.main.width - 100;

    this.input.on('pointerdown', (p) => {
      if (p.x < RZ && !this.joystick.active) {
        this.joystick.active = true;
        this.joystick.baseX  = p.x; this.joystick.baseY  = p.y;
        this.joystick.stickX = p.x; this.joystick.stickY = p.y;
        this.joystick.dx = 0;       this.joystick.dy = 0;
      }
    });
    this.input.on('pointermove', (p) => {
      if (!this.joystick.active) return;
      const dx = p.x - this.joystick.baseX, dy = p.y - this.joystick.baseY;
      const dist = Math.sqrt(dx * dx + dy * dy), a = Math.atan2(dy, dx);
      const cl = Math.min(dist, this.joystick.radius);
      this.joystick.stickX = this.joystick.baseX + Math.cos(a) * cl;
      this.joystick.stickY = this.joystick.baseY + Math.sin(a) * cl;
      this.joystick.dx     = dist > 8 ? Math.cos(a) : 0;
      this.joystick.dy     = dist > 8 ? Math.sin(a) : 0;
    });
    this.input.on('pointerup', () => {
      this.joystick.active = false;
      this.joystick.dx = 0; this.joystick.dy = 0;
    });
  }

  _drawJoystick() {
    this.joystickGfx.clear();
    if (!this.joystick.active) return;
    const { baseX, baseY, stickX, stickY, radius } = this.joystick;
    this.joystickGfx.lineStyle(2, 0xffffff, 0.16); this.joystickGfx.strokeCircle(baseX, baseY, radius);
    this.joystickGfx.lineStyle(1, 0xffffff, 0.10); this.joystickGfx.strokeCircle(baseX, baseY, radius * 0.5);
    this.joystickGfx.fillStyle(COL.cell, 0.28);     this.joystickGfx.fillCircle(stickX, stickY, 20);
    this.joystickGfx.lineStyle(1.5, COL.cell, 0.5); this.joystickGfx.strokeCircle(stickX, stickY, 20);
  }

  // ── Keyboard ───────────────────────────────────────────────
  _setupKeyboard() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd    = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      fiss:  Phaser.Input.Keyboard.KeyCodes.F,
      bact:  Phaser.Input.Keyboard.KeyCodes.B,
      conj:  Phaser.Input.Keyboard.KeyCodes.C,
    });
  }

  // ── Background ─────────────────────────────────────────────
  _drawDotField() {
    this.bgGraphics.fillStyle(0x112211, 0.6);
    const sp = 110;
    for (let x = 0; x <= WORLD_W; x += sp) {
      for (let y = 0; y <= WORLD_H; y += sp) {
        const jx = Phaser.Math.Between(-16, 16), jy = Phaser.Math.Between(-16, 16);
        this.bgGraphics.fillCircle(x + jx, y + jy, 1.2);
      }
    }
    this.bgGraphics.lineStyle(0.4, 0x0a1a0a, 0.35);
    for (let x = 0; x <= WORLD_W; x += 320) this.bgGraphics.lineBetween(x, 0, x, WORLD_H);
    for (let y = 0; y <= WORLD_H; y += 320) this.bgGraphics.lineBetween(0, y, WORLD_W, y);
  }

  // ── Spawning ───────────────────────────────────────────────
  _spawnFood(n) {
    for (let i = 0; i < n; i++) {
      this.foodGroup.create(
        Phaser.Math.Between(50, WORLD_W - 50),
        Phaser.Math.Between(50, WORLD_H - 50), 'food'
      ).setDepth(5).setTint(COL.food);
    }
  }

  _spawnGenes(n) {
    for (let i = 0; i < n; i++) {
      const key = GENE_KEYS[i % GENE_KEYS.length];
      const x = Phaser.Math.Between(80, WORLD_W - 80), y = Phaser.Math.Between(80, WORLD_H - 80);
      const g = this.geneGroup.create(x, y, 'gene_' + key).setDepth(6).setTint(GENES[key].color);
      g.setData('geneKey', key);
      this.tweens.add({ targets: g, y: y - 7, duration: 1500 + Math.random() * 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  // ── Game over screen ───────────────────────────────────────
  _showGameOver(reason) {
    const elapsed = Math.floor((this.time.now - this.startTime) / 1000);
    const w = this.cameras.main.width, h = this.cameras.main.height;

    const ov = this.add.graphics().setScrollFactor(0).setDepth(200);
    ov.fillStyle(0x000000, 0.85); ov.fillRect(0, 0, w, h);

    this.add.text(w / 2, h / 2 - 65, reason || 'CELL DEAD', {
      fontSize: '34px', fill: '#ff2244', fontFamily: 'monospace'
    }).setScrollFactor(0).setDepth(201).setOrigin(0.5);

    this.add.text(w / 2, h / 2, `${elapsed}s   ${this.killCount} kills`, {
      fontSize: '17px', fill: '#778899', fontFamily: 'monospace'
    }).setScrollFactor(0).setDepth(201).setOrigin(0.5);

    const rb = this.add.text(w / 2, h / 2 + 62, 'TAP OR PRESS ANY KEY', {
      fontSize: '13px', fill: '#00ff66', fontFamily: 'monospace'
    }).setScrollFactor(0).setDepth(201).setOrigin(0.5);
    this.tweens.add({ targets: rb, alpha: 0.15, duration: 600, yoyo: true, repeat: -1 });

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
  scale: {
    mode:       Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent:     document.body,
  },
};

const game = new Phaser.Game(config);
window.addEventListener('resize', () => game.scale.resize(window.innerWidth, window.innerHeight));
