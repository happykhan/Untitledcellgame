// ============================================================
//  Untitled Cell Game  —  Phaser 3, single-file, no build step
// ============================================================

const WORLD_W = 3200;
const WORLD_H = 3200;

// ── colours ─────────────────────────────────────────────────
const COL = {
  bg:        0x0a0a1a,
  cell:      0x00e5ff,   // cyan
  flagellum: 0x00bcd4,
  food:      0xff9800,   // orange
  predator:  0xff3d3d,   // red
  gene:      0x00e676,   // green
  hud:       0xffffff,
  hot:       0xff6600,
  cold:      0x0066ff,
};

// ── gene definitions ────────────────────────────────────────
const GENES = {
  HSP: { name: 'Heat Shock Proteins', color: 0xff6600, symbol: 'H', desc: '-drain at high temp' },
  CSP: { name: 'Cold Shock Proteins', color: 0x00aaff, symbol: 'C', desc: '-drain at low temp' },
  FLAGELLUM: { name: 'Extra Flagellum', color: 0xaaff00, symbol: 'F', desc: '+40% speed, +10% drain' },
  MEMBRANE:  { name: 'Thick Membrane',  color: 0xffaa00, symbol: 'M', desc: '+escape time, -15% speed' },
};
const GENE_KEYS = Object.keys(GENES);

// ═══════════════════════════════════════════════════════════
//  BOOT SCENE  – generate textures programmatically
// ═══════════════════════════════════════════════════════════
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    // ── cell body texture ──────────────────────────────────
    const cg = this.make.graphics({ x:0, y:0, add:false });
    cg.lineStyle(2, COL.cell, 1);
    cg.strokeEllipse(40, 30, 70, 50);
    // nucleus
    cg.lineStyle(1, COL.cell, 0.6);
    cg.strokeCircle(40, 30, 10);
    // mitochondria hint
    cg.lineStyle(1, COL.cell, 0.4);
    cg.strokeEllipse(55, 22, 12, 6);
    cg.generateTexture('cell', 80, 60);
    cg.destroy();

    // ── food texture ──────────────────────────────────────
    const fg = this.make.graphics({ x:0, y:0, add:false });
    fg.lineStyle(1.5, COL.food, 1);
    fg.strokeCircle(6, 6, 5);
    fg.lineStyle(1, COL.food, 0.5);
    fg.strokeCircle(6, 6, 3);
    fg.generateTexture('food', 12, 12);
    fg.destroy();

    // ── predator texture ──────────────────────────────────
    const pg = this.make.graphics({ x:0, y:0, add:false });
    pg.lineStyle(2.5, COL.predator, 1);
    pg.strokeEllipse(55, 45, 90, 70);
    pg.lineStyle(1.5, COL.predator, 0.5);
    pg.strokeCircle(55, 45, 15);
    pg.generateTexture('predator', 110, 90);
    pg.destroy();

    // ── gene pickup textures ───────────────────────────────
    GENE_KEYS.forEach(key => {
      const gg = this.make.graphics({ x:0, y:0, add:false });
      gg.lineStyle(1.5, GENES[key].color, 1);
      gg.strokeCircle(10, 10, 9);
      // simple helix hint
      for (let i = 0; i < 5; i++) {
        const x = 5 + i * 2.5;
        const y1 = 10 + Math.sin(i * 1.2) * 5;
        const y2 = 10 - Math.sin(i * 1.2) * 5;
        gg.fillStyle(GENES[key].color, 0.8);
        gg.fillCircle(x, y1, 1);
        gg.fillCircle(x, y2, 1);
      }
      gg.generateTexture('gene_' + key, 20, 20);
      gg.destroy();
    });

    this.scene.start('Game');
  }
}

// ═══════════════════════════════════════════════════════════
//  GAME SCENE
// ═══════════════════════════════════════════════════════════
class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  // ──────────────────────────────────────────────────────────
  create() {
    this.worldW = WORLD_W;
    this.worldH = WORLD_H;

    // physics world bounds
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    // ── grid background ────────────────────────────────────
    this.bgGraphics = this.add.graphics();
    this._drawGrid();

    // ── environment graphics layer ─────────────────────────
    this.envGraphics = this.add.graphics();
    this.envGraphics.setDepth(0);

    // ── food group ────────────────────────────────────────
    this.foodGroup = this.physics.add.staticGroup();
    this._spawnFood(40);

    // ── gene pickups ──────────────────────────────────────
    this.geneGroup = this.physics.add.staticGroup();
    this._spawnGenes(12);

    // ── player cell ──────────────────────────────────────
    this.player = this.physics.add.image(WORLD_W / 2, WORLD_H / 2, 'cell');
    this.player.setCollideWorldBounds(true);
    this.player.setDamping(true);
    this.player.setDrag(0.92);
    this.player.setMaxVelocity(320);
    this.player.setDepth(10);

    // ── flagellum graphics ────────────────────────────────
    this.flagGraphics = this.add.graphics();
    this.flagGraphics.setDepth(9);

    // ── predator ─────────────────────────────────────────
    this.predator = this.physics.add.image(
      Phaser.Math.Between(200, WORLD_W - 200),
      Phaser.Math.Between(200, WORLD_H - 200),
      'predator'
    );
    this.predator.setCollideWorldBounds(true);
    this.predator.setDamping(true);
    this.predator.setDrag(0.96);
    this.predator.setMaxVelocity(140);
    this.predator.setDepth(8);

    this.pseudopodGraphics = this.add.graphics();
    this.pseudopodGraphics.setDepth(7);

    // ── camera ────────────────────────────────────────────
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // ── HUD ───────────────────────────────────────────────
    this._createHUD();

    // ── keyboard input ────────────────────────────────────
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      fiss:  Phaser.Input.Keyboard.KeyCodes.F,
    });

    // ── touch input ───────────────────────────────────────
    this._setupTouch();

    // ── overlaps ─────────────────────────────────────────
    this.physics.add.overlap(this.player, this.foodGroup,  this._eatFood,  null, this);
    this.physics.add.overlap(this.player, this.geneGroup,  this._collectGene, null, this);
    this.physics.add.overlap(this.player, this.predator,   this._engulf,   null, this);

    // ── game state ────────────────────────────────────────
    this.energy       = 100;          // 0–200 (150+ unlocks fission, 0 = death)
    this.maxEnergy    = 100;
    this.playerGenes  = [];
    this.activeGenes  = new Set();
    this.alive        = true;
    this.fissioning   = false;
    this.engulfing    = false;
    this.engulfTimer  = 0;
    this.startTime    = this.time.now;
    this.tumbling     = false;
    this.tumbleAngle  = 0;
    this.flagPhase    = 0;
    this.flagSpeed    = 0;

    // temperature
    this.temp         = 37;
    this.targetTemp   = 37;
    this.tempTimer    = 0;
    this.tempInterval = 15000;   // ms between temp events

    // daughter cells (wander AI)
    this.daughters    = [];

    // fission key
    this.fissJustPressed = false;

    // double-tap detection
    this.lastTap = 0;
  }

  // ──────────────────────────────────────────────────────────
  //  UPDATE
  // ──────────────────────────────────────────────────────────
  update(time, delta) {
    if (!this.alive) return;
    if (this.fissioning) { this._updateFission(delta); return; }

    const dt = delta / 1000;

    // ── temperature cycle ─────────────────────────────────
    this._updateTemp(dt);

    // ── energy drain ─────────────────────────────────────
    this._updateEnergy(dt);

    // ── movement ─────────────────────────────────────────
    this._handleMovement(delta);

    // ── flagellum animation ───────────────────────────────
    this._drawFlagellum();

    // ── predator AI ───────────────────────────────────────
    this._updatePredator(delta);

    // ── daughter cells ────────────────────────────────────
    this._updateDaughters(delta);

    // ── HUD update ────────────────────────────────────────
    this._updateHUD(time);

    // ── env tint ─────────────────────────────────────────
    this._updateEnvTint();

    // ── fission trigger ───────────────────────────────────
    const fissNow = Phaser.Input.Keyboard.JustDown(this.wasd.fiss);
    if (fissNow && this.energy > 150) {
      this._triggerFission();
    }

    // ── food replenish ────────────────────────────────────
    if (this.foodGroup.getLength() < 20) {
      this._spawnFood(10);
    }
  }

  // ──────────────────────────────────────────────────────────
  //  TEMPERATURE
  // ──────────────────────────────────────────────────────────
  _updateTemp(dt) {
    this.tempTimer += dt * 1000;
    if (this.tempTimer >= this.tempInterval) {
      this.tempTimer = 0;
      const roll = Math.random();
      if (roll < 0.33) {
        this.targetTemp = Phaser.Math.Between(55, 70);  // heat spike
      } else if (roll < 0.66) {
        this.targetTemp = Phaser.Math.Between(10, 20);  // cold spike
      } else {
        this.targetTemp = 37;                            // back to optimal
      }
    }
    // lerp toward target
    this.temp += (this.targetTemp - this.temp) * dt * 0.3;
  }

  // ──────────────────────────────────────────────────────────
  //  ENERGY DRAIN
  // ──────────────────────────────────────────────────────────
  _updateEnergy(dt) {
    let drain = 1.0;  // %/sec baseline

    // extra flagellum
    if (this.activeGenes.has('FLAGELLUM')) drain += 0.1;

    const isHot  = this.temp > 42;
    const isCold = this.temp < 30;

    if (isHot || isCold) {
      const hasAdapt = isHot
        ? this.activeGenes.has('HSP')
        : this.activeGenes.has('CSP');
      drain *= hasAdapt ? 2 : 4;
    }

    this.energy -= drain * dt;

    if (this.energy <= 0) {
      this.energy = 0;
      this._gameOver();
    }
  }

  // ──────────────────────────────────────────────────────────
  //  MOVEMENT  (run-and-tumble)
  // ──────────────────────────────────────────────────────────
  _handleMovement(delta) {
    const up    = this.cursors.up.isDown    || this.wasd.up.isDown    || this.touchUp;
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown  || this.touchDown;
    const left  = this.cursors.left.isDown  || this.wasd.left.isDown  || this.touchLeft;
    const right = this.cursors.right.isDown || this.wasd.right.isDown || this.touchRight;
    const tumbleKey = this.cursors.space.isDown || this.wasd.space.isDown || this.touchTumble;

    let baseSpeed = 280;
    if (this.activeGenes.has('FLAGELLUM'))  baseSpeed *= 1.4;
    if (this.activeGenes.has('MEMBRANE'))   baseSpeed *= 0.85;

    const thrusting = up || down || left || right;

    // steering
    if (left)  this.player.angle -= 3;
    if (right) this.player.angle += 3;

    if (this.tumbling) {
      // tumble: random rotation
      this.player.angle += this.tumbleAngle * (delta / 1000);
      this.tumbleTimer -= delta;
      if (this.tumbleTimer <= 0) this.tumbling = false;
    } else if (up || this.touchThrust) {
      const rad = Phaser.Math.DegToRad(this.player.angle - 90);
      this.physics.velocityFromRotation(rad, baseSpeed, this.player.body.acceleration);
      this.flagSpeed = 1.0;
    } else if (down) {
      const rad = Phaser.Math.DegToRad(this.player.angle - 90 + 180);
      this.physics.velocityFromRotation(rad, baseSpeed * 0.5, this.player.body.acceleration);
      this.flagSpeed = 0.5;
    } else {
      this.player.body.setAcceleration(0, 0);
      this.flagSpeed = Math.max(0, this.flagSpeed - 0.02);
    }

    if (tumbleKey && !this.tumbling) {
      this.tumbling    = true;
      this.tumbleTimer = 300 + Math.random() * 200;
      this.tumbleAngle = (Math.random() < 0.5 ? -1 : 1) * (90 + Math.random() * 180);
      this.player.body.setAcceleration(0, 0);
    }
  }

  // ──────────────────────────────────────────────────────────
  //  FLAGELLUM DRAWING
  // ──────────────────────────────────────────────────────────
  _drawFlagellum() {
    this.flagGraphics.clear();

    const px = this.player.x;
    const py = this.player.y;
    const angle = Phaser.Math.DegToRad(this.player.angle - 90);
    const hasDual = this.activeGenes.has('FLAGELLUM');

    this.flagPhase += 0.12 + this.flagSpeed * 0.18;

    this._drawOneFlagellum(px, py, angle, this.flagPhase);
    if (hasDual) {
      this._drawOneFlagellum(px, py, angle + 0.3, this.flagPhase + Math.PI);
    }
  }

  _drawOneFlagellum(px, py, baseAngle, phase) {
    const len     = 50;
    const segs    = 20;
    const amp     = 5 + this.flagSpeed * 3;
    const perpX   = Math.cos(baseAngle + Math.PI / 2);
    const perpY   = Math.sin(baseAngle + Math.PI / 2);
    const backX   = Math.cos(baseAngle + Math.PI);
    const backY   = Math.sin(baseAngle + Math.PI);

    // start at cell rear
    const startX = px + backX * 26;
    const startY = py + backY * 26;

    this.flagGraphics.lineStyle(1.5, COL.flagellum, 0.85);
    this.flagGraphics.beginPath();
    this.flagGraphics.moveTo(startX, startY);

    for (let i = 1; i <= segs; i++) {
      const t   = i / segs;
      const cx  = startX + backX * len * t;
      const cy  = startY + backY * len * t;
      const wav = Math.sin(phase + t * Math.PI * 3) * amp * (1 - t * 0.4);
      this.flagGraphics.lineTo(cx + perpX * wav, cy + perpY * wav);
    }
    this.flagGraphics.strokePath();
  }

  // ──────────────────────────────────────────────────────────
  //  EAT FOOD
  // ──────────────────────────────────────────────────────────
  _eatFood(player, food) {
    food.destroy();
    this.energy = Math.min(200, this.energy + 20);
    // flash
    this.tweens.add({ targets: player, alpha: 0.6, duration: 80, yoyo: true });
  }

  // ──────────────────────────────────────────────────────────
  //  COLLECT GENE
  // ──────────────────────────────────────────────────────────
  _collectGene(player, genePick) {
    if (!genePick.active) return;
    const key = genePick.getData('geneKey');
    if (this.activeGenes.size >= 3) {
      // no room — flash gene red to signal rejection
      this.tweens.add({ targets: genePick, tint: 0xff0000, alpha: 0.3, duration: 300, yoyo: true });
      return;
    }
    if (this.activeGenes.has(key)) return;  // already have it

    genePick.destroy();
    this.activeGenes.add(key);
    this._updateGeneHUD();
  }

  // ──────────────────────────────────────────────────────────
  //  PREDATOR AI
  // ──────────────────────────────────────────────────────────
  _updatePredator(delta) {
    const dist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      this.predator.x, this.predator.y
    );

    const detectRadius = 280;
    const chasing = dist < detectRadius;
    const speed   = chasing ? 120 : 40;

    if (chasing) {
      this.physics.moveToObject(this.predator, this.player, speed);
    } else {
      // wander
      if (!this.predator.wanderTimer || this.predator.wanderTimer <= 0) {
        const angle = Math.random() * Math.PI * 2;
        this.predator.body.setVelocity(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed
        );
        this.predator.wanderTimer = 2000 + Math.random() * 3000;
      }
      this.predator.wanderTimer -= delta;
    }

    // pseudopod drawing
    this.pseudopodGraphics.clear();
    if (chasing && dist < 180) {
      this._drawPseudopods();
    }
  }

  _drawPseudopods() {
    const num = 3;
    for (let i = 0; i < num; i++) {
      const baseAngle = Math.atan2(
        this.player.y - this.predator.y,
        this.player.x - this.predator.x
      ) + (i - 1) * 0.4;

      const len    = 40 + Math.sin(this.flagPhase * 2 + i) * 12;
      const phase  = this.flagPhase * 1.5 + i * 2;
      const segs   = 15;
      const amp    = 4;

      const px = this.predator.x;
      const py = this.predator.y;
      const perpX = Math.cos(baseAngle + Math.PI / 2);
      const perpY = Math.sin(baseAngle + Math.PI / 2);

      this.pseudopodGraphics.lineStyle(2, COL.predator, 0.7);
      this.pseudopodGraphics.beginPath();
      this.pseudopodGraphics.moveTo(px + Math.cos(baseAngle) * 45, py + Math.sin(baseAngle) * 35);

      for (let s = 1; s <= segs; s++) {
        const t   = s / segs;
        const cx  = px + Math.cos(baseAngle) * (45 + len * t);
        const cy  = py + Math.sin(baseAngle) * (35 + len * t);
        const wav = Math.sin(phase + t * Math.PI * 2) * amp;
        this.pseudopodGraphics.lineTo(cx + perpX * wav, cy + perpY * wav);
      }
      this.pseudopodGraphics.strokePath();
    }
  }

  // ──────────────────────────────────────────────────────────
  //  ENGULF
  // ──────────────────────────────────────────────────────────
  _engulf() {
    if (this.engulfing || this.fissioning) return;
    this.engulfing  = true;

    const hasMembrane = this.activeGenes.has('MEMBRANE');
    const engulfTime  = hasMembrane ? 3000 : 1000;

    // wiggle animation
    this.tweens.add({
      targets:  this.player,
      scaleX:   1.3,
      scaleY:   0.7,
      duration: 150,
      yoyo:     true,
      repeat:   hasMembrane ? 8 : 2,
      onComplete: () => {
        if (!this.alive) return;
        this._gameOver();
      }
    });
  }

  // ──────────────────────────────────────────────────────────
  //  FISSION
  // ──────────────────────────────────────────────────────────
  _triggerFission() {
    if (this.fissioning) return;
    this.fissioning = true;
    this.fissTimer  = 0;

    // elongate the cell
    this.tweens.add({
      targets:  this.player,
      scaleX:   0.6,
      scaleY:   1.5,
      duration: 400,
      yoyo:     false,
      onComplete: () => {
        this._completeFission();
      }
    });
  }

  _completeFission() {
    // spawn daughter
    const daughterX = this.player.x + Phaser.Math.Between(-60, 60);
    const daughterY = this.player.y + Phaser.Math.Between(-60, 60);

    const daughter = this.physics.add.image(daughterX, daughterY, 'cell');
    daughter.setDamping(true);
    daughter.setDrag(0.93);
    daughter.setMaxVelocity(220);
    daughter.setDepth(10);
    daughter.setTint(0x88ffee);
    daughter.genes     = new Set(this.activeGenes);
    daughter.wanderDir = Math.random() * Math.PI * 2;
    daughter.wanderTimer = 0;
    daughter.flagPhase = 0;
    this.daughters.push(daughter);

    // reset player
    this.player.setScale(1, 1);
    this.player.angle = 0;
    this.energy       = 80;
    this.activeGenes  = new Set();
    this.fissioning   = false;
    this._updateGeneHUD();

    // push them apart
    const angle = Math.atan2(daughterY - this.player.y, daughterX - this.player.x);
    daughter.body.setVelocity(Math.cos(angle) * 120, Math.sin(angle) * 120);
    this.player.body.setVelocity(-Math.cos(angle) * 80, -Math.sin(angle) * 80);
  }

  // ──────────────────────────────────────────────────────────
  //  DAUGHTER WANDER AI
  // ──────────────────────────────────────────────────────────
  _updateDaughters(delta) {
    for (let i = this.daughters.length - 1; i >= 0; i--) {
      const d = this.daughters[i];
      if (!d.active) { this.daughters.splice(i, 1); continue; }

      d.wanderTimer -= delta;
      if (d.wanderTimer <= 0) {
        d.wanderDir   += (Math.random() - 0.5) * 1.5;
        d.wanderTimer  = 800 + Math.random() * 1500;
        d.body.setVelocity(
          Math.cos(d.wanderDir) * 80,
          Math.sin(d.wanderDir) * 80
        );
      }
      d.angle = Phaser.Math.RadToDeg(d.wanderDir) + 90;
      d.flagPhase += 0.1;

      // draw their flagellum
      const angle = Phaser.Math.DegToRad(d.angle - 90);
      this._drawOneFlagellum(d.x, d.y, angle, d.flagPhase);
    }
  }

  // ──────────────────────────────────────────────────────────
  //  ENVIRONMENT TINT
  // ──────────────────────────────────────────────────────────
  _updateEnvTint() {
    const t = this.temp;
    if (t > 42) {
      // hot: orange/red tint overlay
      const intensity = Math.min((t - 42) / 28, 1) * 0.18;
      this.cameras.main.setBackgroundColor(
        Phaser.Display.Color.GetColor(
          Math.floor(10 + intensity * 80),
          Math.floor(10 - intensity * 5),
          Math.floor(26 - intensity * 20)
        )
      );
    } else if (t < 30) {
      // cold: blue tint
      const intensity = Math.min((30 - t) / 20, 1) * 0.18;
      this.cameras.main.setBackgroundColor(
        Phaser.Display.Color.GetColor(
          Math.floor(10 - intensity * 5),
          Math.floor(10 - intensity * 5),
          Math.floor(26 + intensity * 80)
        )
      );
    } else {
      this.cameras.main.setBackgroundColor(0x0a0a1a);
    }
  }

  // ──────────────────────────────────────────────────────────
  //  HUD
  // ──────────────────────────────────────────────────────────
  _createHUD() {
    const cam   = this.cameras.main;
    const w     = cam.width;
    const h     = cam.height;

    this.hudContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(100);

    // ── energy bar background ──────────────────────────────
    const ebg = this.add.graphics();
    ebg.lineStyle(1, 0x444466, 1);
    ebg.strokeRect(12, 12, 160, 14);
    this.hudContainer.add(ebg);

    this.energyBar = this.add.graphics();
    this.hudContainer.add(this.energyBar);

    this.energyLabel = this.add.text(12, 30, 'ENERGY', {
      fontSize: '9px', fill: '#aaaacc', fontFamily: 'monospace'
    });
    this.hudContainer.add(this.energyLabel);

    // ── temperature gauge ─────────────────────────────────
    this.tempText = this.add.text(w - 12, 12, 'TEMP: 37°C', {
      fontSize: '11px', fill: '#ffffff', fontFamily: 'monospace',
      align: 'right'
    }).setOrigin(1, 0);
    this.hudContainer.add(this.tempText);

    this.tempBar = this.add.graphics();
    this.hudContainer.add(this.tempBar);

    // ── score ─────────────────────────────────────────────
    this.scoreText = this.add.text(w / 2, 12, 'TIME: 0s', {
      fontSize: '11px', fill: '#ffffff', fontFamily: 'monospace',
      align: 'center'
    }).setOrigin(0.5, 0);
    this.hudContainer.add(this.scoreText);

    // ── gene slots ────────────────────────────────────────
    this.geneSlots = [];
    for (let i = 0; i < 3; i++) {
      const sx = w / 2 - 50 + i * 50;
      const sy = h - 48;

      const bg = this.add.graphics();
      bg.lineStyle(1, 0x334455, 1);
      bg.strokeRect(sx - 16, sy - 16, 32, 32);
      this.hudContainer.add(bg);

      const label = this.add.text(sx, sy + 18, '', {
        fontSize: '8px', fill: '#aaffaa', fontFamily: 'monospace', align: 'center'
      }).setOrigin(0.5, 0);
      this.hudContainer.add(label);

      this.geneSlots.push({ bg, label, sx, sy });
    }

    // ── fission indicator ─────────────────────────────────
    this.fissIndicator = this.add.text(w / 2, h - 80, '[ FISSION READY — press F ]', {
      fontSize: '10px', fill: '#00ff88', fontFamily: 'monospace', align: 'center'
    }).setOrigin(0.5, 0.5).setAlpha(0);
    this.hudContainer.add(this.fissIndicator);

    // ── mobile touch controls ─────────────────────────────
    if (!this.sys.game.device.input.touch) return;

    this._buildTouchHUD(w, h);
  }

  _buildTouchHUD(w, h) {
    const alpha = 0.25;
    const btns  = [
      { label: '▲', x: w - 110, y: h - 130, key: 'touchUp'    },
      { label: '▼', x: w - 110, y: h - 50,  key: 'touchDown'  },
      { label: '◀', x: w - 160, y: h - 90,  key: 'touchLeft'  },
      { label: '▶', x: w - 60,  y: h - 90,  key: 'touchRight' },
      { label: '↺', x: 50,      y: h - 90,  key: 'touchTumble'},
    ];

    btns.forEach(b => {
      const zone = this.add.text(b.x, b.y, b.label, {
        fontSize: '28px', fill: '#ffffff', fontFamily: 'sans-serif', alpha
      }).setScrollFactor(0).setDepth(200).setOrigin(0.5).setInteractive();

      zone.on('pointerdown', () => { this[b.key] = true;  });
      zone.on('pointerup',   () => { this[b.key] = false; });
      zone.on('pointerout',  () => { this[b.key] = false; });
    });

    // thrust = up on mobile by default (tap anywhere on world half)
    this.input.on('pointerdown', (p) => {
      const now = this.time.now;
      if (now - this.lastTap < 300) {
        // double tap = fission
        if (this.energy > 150) this._triggerFission();
      }
      this.lastTap = now;
    });
  }

  _updateHUD(time) {
    // energy bar
    this.energyBar.clear();
    const pct   = Math.min(this.energy / 200, 1);
    const color = this.energy > 150 ? 0x00ff88 :
                  this.energy > 50  ? 0x00e5ff :
                  0xff4444;
    this.energyBar.fillStyle(color, 0.85);
    this.energyBar.fillRect(13, 13, Math.floor(158 * pct), 12);

    // temp
    const tempCol = this.temp > 50 ? '#ff4400' :
                    this.temp < 25 ? '#44aaff' : '#ffffff';
    this.tempText.setText(`TEMP: ${Math.round(this.temp)}°C`).setStyle({ fill: tempCol });

    // score
    const sec = Math.floor((time - this.startTime) / 1000);
    this.scoreText.setText(`TIME: ${sec}s`);

    // fission indicator
    this.fissIndicator.setAlpha(this.energy > 150 ? 1 : 0);

    // gene slots
    this._updateGeneHUD();
  }

  _updateGeneHUD() {
    const gArr = Array.from(this.activeGenes);
    this.geneSlots.forEach((slot, i) => {
      const key = gArr[i];
      slot.label.setText(key ? GENES[key].symbol : '');
      slot.bg.clear();
      const col = key ? GENES[key].color : 0x334455;
      slot.bg.lineStyle(1, col, key ? 0.9 : 0.3);
      slot.bg.strokeRect(slot.sx - 16, slot.sy - 16, 32, 32);
    });
  }

  // ──────────────────────────────────────────────────────────
  //  GRID BACKGROUND
  // ──────────────────────────────────────────────────────────
  _drawGrid() {
    this.bgGraphics.lineStyle(0.5, 0x1a1a3a, 0.6);
    const step = 80;
    for (let x = 0; x <= WORLD_W; x += step) {
      this.bgGraphics.lineBetween(x, 0, x, WORLD_H);
    }
    for (let y = 0; y <= WORLD_H; y += step) {
      this.bgGraphics.lineBetween(0, y, WORLD_W, y);
    }
  }

  // ──────────────────────────────────────────────────────────
  //  SPAWNING
  // ──────────────────────────────────────────────────────────
  _spawnFood(n) {
    for (let i = 0; i < n; i++) {
      const x = Phaser.Math.Between(50, WORLD_W - 50);
      const y = Phaser.Math.Between(50, WORLD_H - 50);
      this.foodGroup.create(x, y, 'food').setDepth(5);
    }
  }

  _spawnGenes(n) {
    const keys = GENE_KEYS;
    for (let i = 0; i < n; i++) {
      const x   = Phaser.Math.Between(50, WORLD_W - 50);
      const y   = Phaser.Math.Between(50, WORLD_H - 50);
      const key = keys[i % keys.length];
      const g   = this.geneGroup.create(x, y, 'gene_' + key).setDepth(6);
      g.setData('geneKey', key);
      // gentle float bob
      this.tweens.add({
        targets:  g,
        y:        y - 5,
        duration: 1500 + Math.random() * 500,
        yoyo:     true,
        repeat:   -1,
        ease:     'Sine.easeInOut'
      });
    }
  }

  // ──────────────────────────────────────────────────────────
  //  TOUCH SETUP
  // ──────────────────────────────────────────────────────────
  _setupTouch() {
    this.touchUp     = false;
    this.touchDown   = false;
    this.touchLeft   = false;
    this.touchRight  = false;
    this.touchTumble = false;
    this.touchThrust = false;
  }

  // ──────────────────────────────────────────────────────────
  //  GAME OVER
  // ──────────────────────────────────────────────────────────
  _gameOver() {
    if (!this.alive) return;
    this.alive = false;

    // stop movement
    this.player.body.setVelocity(0, 0);
    this.player.body.setAcceleration(0, 0);

    const elapsed = Math.floor((this.time.now - this.startTime) / 1000);

    // flash player red then fade
    this.tweens.add({
      targets:  this.player,
      alpha:    0,
      scaleX:   2,
      scaleY:   2,
      duration: 600,
      ease:     'Power2',
    });

    // overlay
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    const overlay = this.add.graphics().setScrollFactor(0).setDepth(200);
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, w, h);

    this.add.text(w / 2, h / 2 - 60, 'GAME OVER', {
      fontSize: '36px', fill: '#ff4444', fontFamily: 'monospace', align: 'center'
    }).setScrollFactor(0).setDepth(201).setOrigin(0.5);

    this.add.text(w / 2, h / 2, `TIME SURVIVED: ${elapsed}s`, {
      fontSize: '18px', fill: '#ffffff', fontFamily: 'monospace', align: 'center'
    }).setScrollFactor(0).setDepth(201).setOrigin(0.5);

    const restartBtn = this.add.text(w / 2, h / 2 + 60, '[ PRESS ANY KEY / TAP TO RESTART ]', {
      fontSize: '14px', fill: '#00e5ff', fontFamily: 'monospace', align: 'center'
    }).setScrollFactor(0).setDepth(201).setOrigin(0.5);

    // blink
    this.tweens.add({
      targets:  restartBtn,
      alpha:    0.2,
      duration: 600,
      yoyo:     true,
      repeat:   -1,
    });

    // restart on any key or tap
    this.input.keyboard.once('keydown', () => this.scene.restart());
    this.input.once('pointerdown', () => this.scene.restart());
  }

  // ──────────────────────────────────────────────────────────
  //  FISSION UPDATE (placeholder — handled by tweens)
  // ──────────────────────────────────────────────────────────
  _updateFission(delta) {
    // handled via tween callbacks
  }
}

// ═══════════════════════════════════════════════════════════
//  PHASER CONFIG
// ═══════════════════════════════════════════════════════════
const config = {
  type: Phaser.AUTO,
  backgroundColor: '#0a0a1a',
  width:  window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: 'arcade',
    arcade:  { debug: false }
  },
  scene: [BootScene, GameScene],
  scale: {
    mode:            Phaser.Scale.RESIZE,
    autoCenter:      Phaser.Scale.CENTER_BOTH,
    parent:          document.body,
  },
};

const game = new Phaser.Game(config);

// keep canvas filling window on resize
window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});
