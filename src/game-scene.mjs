import { steerVelocity } from "./input/movement.mjs";
import { GENES, GENE_KEYS, WORLD_W, WORLD_H, getViewportSettings } from "./config.mjs";
import { NPC_PALS, getPlayerPalette } from "./rendering/palettes.mjs";
import createWorldView from "./rendering/create-world-view.mjs";
import { createWorldRenderState } from "./rendering/create-world-render-state.mjs";
import {
  canControlCell,
  getAbilityAvailability,
  getRunScore,
  getSwimmingSpeed,
  findConjugationTarget,
  CONJUGATION_RANGE,
} from "./domain/game-rules.mjs";
import { loadScoreboard, saveRunScore } from "./domain/score-store.mjs";
import createHudState from "./ui/create-hud-state.mjs";
import { showInstructions, showGameOver } from "./ui/run-overlays.mjs";
import SwimInput from "./input/swim-input.mjs";
import SwimGuide from "./input/swim-guide.mjs";
import CellHUD from "./ui/cell-hud.mjs";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("Game");
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    this.foodGroup = this.physics.add.staticGroup();
    this._spawnFood(100, { x: WORLD_W / 2 + 110, y: WORLD_H / 2 - 170 });
    this.geneGroup = this.physics.add.staticGroup();
    this._spawnGenes(20);

    this.player = this.physics.add.image(WORLD_W / 2, WORLD_H / 2, "phys");
    this.player
      .setAlpha(0)
      .setCollideWorldBounds(true)
      .setBounce(1, 1)
      .setDamping(true)
      .setDrag(0.32)
      .setMaxVelocity(340)
      .setDepth(10);
    this.player.body.setCircle(16, -14, -14);

    this.fxGfx = this.add.graphics().setDepth(20);

    this.npcCells = [];
    this.nextCellId = 0;
    this._spawnNPCs(18);

    this.predator = this.physics.add.image(
      Phaser.Math.Between(600, WORLD_W - 600),
      Phaser.Math.Between(600, WORLD_H - 600),
      "phys",
    );
    this.predator
      .setAlpha(0)
      .setCollideWorldBounds(true)
      .setBounce(0.8, 0.8)
      .setDamping(true)
      .setDrag(0.95)
      .setMaxVelocity(150)
      .setDepth(8);
    this.predator.body.setCircle(58, -56, -56);

    this.daughters = [];

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.viewport = getViewportSettings(this.scale.width, this.scale.height);
    this.cameras.main.setZoom(this.viewport.zoom);
    const resize = (gameSize) => {
      this.viewport = getViewportSettings(gameSize.width, gameSize.height);
      this.cameras.main.setSize(gameSize.width, gameSize.height);
      this.cameras.main.setZoom(this.viewport.zoom);
      this.cameras.main.centerOn(this.player.x, this.player.y);
      this.swimInput?.reset();
      this.worldView?.resize(gameSize.width, gameSize.height);
    };
    this.scale.on("resize", resize);
    this.events.once("shutdown", () => this.scale.off("resize", resize));

    this.physics.add.overlap(this.player, this.foodGroup, this._eatFood, null, this);
    this.physics.add.overlap(this.player, this.geneGroup, this._collectGene, null, this);
    this.physics.add.overlap(this.player, this.predator, this._engulf, null, this);

    this.energy = 100;
    this.activeGenes = new Set();
    this.alive = true;
    this.fissioning = false;
    this.engulfing = false;
    this.dying = false;
    this.dyingPulse = false;
    this.playerAlpha = 1.0;
    this.temp = 37;
    this.targetTemp = 37;
    this.tempTimer = 0;
    this.tempInterval = 15000;
    this.flagPhase = 0;
    this.flagSpeed = 0;
    this.tumbling = false;
    this.tumbleAngle = 0;
    this.tumbleTimer = 0;
    this.bacterioTimer = 0;
    this.conjTarget = null;
    this.conjTimer = 0;
    this.conjDuration = 1800;
    this.elapsedMs = 0;
    this.paused = false;
    this.roundOver = false;
    this.nextHudUpdate = 0;
    this.closeOverlay = null;
    this.killCount = 0;
    this.thrustAngle = -Math.PI / 2; // initially pointing up
    this.fissionScale = { x: 1, y: 1 };
    this.fissionProgress = 0;
    this.feedGlow = 0;
    this.divisionCount = 0;
    this.showingInstructions = true;

    // Ocean current — slow drift that shifts direction over time
    this.current = {
      angle: Math.random() * Math.PI * 2,
      speed: 20,
      changeTimer: 0,
      changeInterval: 18000,
      targetAngle: Math.random() * Math.PI * 2,
    };
    this.worldView = createWorldView({
      add: this.add,
      camera: this.cameras.main,
      width: this.scale.width,
      height: this.scale.height,
      force2D: new URLSearchParams(window.location.search).get("renderer") === "2d",
      onModeChange: (mode) => {
        for (const pickup of [...this.foodGroup.getChildren(), ...this.geneGroup.getChildren()])
          pickup.setVisible(mode === "2d");
      },
    });
    const drawWorld = () => this.worldView.draw();
    this.events.on("render", drawWorld);
    this.worldView.update(this.viewport, createWorldRenderState(this), 0);
    this._createHUD();
    this._setupKeyboard();
    this._setupTouch();
    this._showInstructions();
    const onVisibility = () => {
      if (document.hidden && this.alive && !this.showingInstructions && !this.paused) this._togglePause();
    };
    document.addEventListener("visibilitychange", onVisibility);
    this.events.once("shutdown", () => {
      document.removeEventListener("visibilitychange", onVisibility);
      this.closeOverlay?.();
      this.swimInput.destroy();
      this.hud.destroy();
      this.events.off("render", drawWorld);
      this.worldView.destroy();
    });
  }

  update(time, delta) {
    if (this.showingInstructions || this.paused || this.roundOver) return;
    const frameDelta = Math.min(delta, 50);
    const dt = frameDelta / 1000;
    if (this.alive && !this.dying) {
      this.elapsedMs += delta;
      if (!this.fissioning) {
        this._updateTemp(dt);
        this._updateEnergy(dt);
        if (this.alive) this._handleMovement(frameDelta, dt);
      }
      if (this.alive) this._updateWorld(frameDelta, dt);
    }
    this.feedGlow = Math.max(0, this.feedGlow - dt * 2);
    this.worldView.update(this.viewport, createWorldRenderState(this), delta);
    this.flagPhase += ((0.12 + this.flagSpeed * 0.18) * frameDelta) / 16.667;
    this.swimInput.draw();
    this._updateHUD(time);
  }

  _updateWorld(delta, dt) {
    this._updatePredator(delta);
    this._updateDaughters(delta);
    this._updateNPCs(delta);
    this._updateConjugation(delta);
    this.bacterioTimer = Math.max(0, this.bacterioTimer - delta);
    this.current.changeTimer += delta;
    if (this.current.changeTimer >= this.current.changeInterval) {
      this.current.changeTimer = 0;
      this.current.targetAngle = Math.random() * Math.PI * 2;
    }
    this.current.angle += (this.current.targetAngle - this.current.angle) * 0.0008 * delta;
    if (!this.fissioning) {
      this.player.body.velocity.x += Math.cos(this.current.angle) * this.current.speed * dt;
      this.player.body.velocity.y += Math.sin(this.current.angle) * this.current.speed * dt;
      if (Phaser.Input.Keyboard.JustDown(this.wasd.fiss)) this._triggerFission();
      if (Phaser.Input.Keyboard.JustDown(this.wasd.bact)) this._fireBacteriocin();
      if (Phaser.Input.Keyboard.JustDown(this.wasd.conj)) this._startConjugation();
    }
    if (this.foodGroup.getLength() < 30) this._spawnFood(20);
  }

  _updateTemp(dt) {
    this.tempTimer += dt * 1000;
    if (this.tempTimer >= this.tempInterval) {
      this.tempTimer = 0;
      const r = Math.random();
      this.targetTemp = r < 0.33 ? Phaser.Math.Between(55, 70) : r < 0.66 ? Phaser.Math.Between(10, 20) : 37;
    }
    this.temp += (this.targetTemp - this.temp) * dt * 0.3;
  }

  _updateEnergy(dt) {
    let drain = 1.0;
    if (this.activeGenes.has("FLAGELLUM")) drain += 0.1;
    const speed = Math.hypot(this.player.body.velocity.x, this.player.body.velocity.y);
    drain += speed * 0.003;
    const isHot = this.temp > 42,
      isCold = this.temp < 30;
    if (isHot || isCold) drain *= (isHot ? this.activeGenes.has("HSP") : this.activeGenes.has("CSP")) ? 2 : 4;
    this.energy -= drain * dt;

    if (this.energy < 30 && !this.dyingPulse) {
      this.dyingPulse = true;
      this._pulseLow();
    }
    if (this.energy <= 0) {
      this.energy = 0;
      this._implode();
    }
  }

  _pulseLow() {
    if (!this.alive || this.dying || !this.dyingPulse) return;
    this.playerAlpha = this.playerAlpha > 0.6 ? 0.35 : 1.0;
    this.time.delayedCall(220, () => this._pulseLow());
  }

  _handleMovement(delta, dt) {
    const baseSpeed = getSwimmingSpeed(this.activeGenes);

    const tumbleKey = this.cursors.space.isDown || this.wasd.space.isDown;
    if (tumbleKey) this._tumble();
    if (this.tumbling) {
      this.thrustAngle += this.tumbleAngle * dt;
      this.tumbleTimer -= delta;
      if (this.tumbleTimer <= 0) this.tumbling = false;
    }

    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;
    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;

    const touch = this.swimInput.vector;
    let direction = touch;
    if (!this.swimInput.gesture) {
      const x = Number(right) - Number(left);
      const y = Number(down) - Number(up);
      const length = Math.hypot(x, y) || 1;
      direction = { x: x / length, y: y / length };
    }
    const velocity = steerVelocity(this.player.body.velocity, direction, baseSpeed * 1.8, dt);
    this.player.body.setAcceleration(0, 0);
    this.player.body.setVelocity(velocity.x, velocity.y);
    const power = Math.hypot(direction.x, direction.y);
    if (power) this.thrustAngle = Math.atan2(direction.y, direction.x);
    this.flagSpeed = power;

    // Cell visual rotation always follows actual velocity (inertia)
    const vx = this.player.body.velocity.x,
      vy = this.player.body.velocity.y;
    if (Math.hypot(vx, vy) > 18) {
      const target = Math.atan2(vy, vx) + Math.PI / 2;
      this.player.rotation = Phaser.Math.Angle.RotateTo(this.player.rotation, target, dt * 7);
    }
  }

  _eatFood(player, food) {
    if (!food.active || this.fissioning || this.dying || !this.alive) return;
    const particle = this.add.image(food.x, food.y, "food").setDepth(19);
    const origin = { x: food.x, y: food.y, progress: 0 };
    food.destroy();
    this.energy = Math.min(200, this.energy + 22);
    if (this.energy > 30) {
      this.dyingPulse = false;
      this.playerAlpha = 1;
    }
    this.feedGlow = 1;
    this.tweens.add({
      targets: origin,
      progress: 1,
      duration: 260,
      ease: "Cubic.easeIn",
      onUpdate: () => {
        particle.setPosition(
          Phaser.Math.Linear(origin.x, player.x, origin.progress),
          Phaser.Math.Linear(origin.y, player.y, origin.progress),
        );
        particle.setScale(1 - origin.progress * 0.85).setAlpha(1 - origin.progress * 0.5);
      },
      onComplete: () => particle.destroy(),
    });
  }

  _collectGene(player, pick) {
    if (!pick.active) return;
    const key = pick.getData("geneKey");
    if (this.activeGenes.size >= 3 || this.activeGenes.has(key)) {
      this.tweens.add({ targets: pick, alpha: 0.3, duration: 250, yoyo: true });
      return;
    }
    pick.destroy();
    this.activeGenes.add(key);
    this.hud.notify("Adaptation acquired: " + GENES[key].desc, this.time.now);
    if (this.dyingPulse && this.energy > 30) {
      this.dyingPulse = false;
      this.playerAlpha = 1.0;
    }
    const gc = GENES[key].color;
    this.cameras.main.flash(180, (gc >> 16) & 0xff, (gc >> 8) & 0xff, gc & 0xff, true);
  }

  _spawnNPCs(n) {
    for (let i = 0; i < n; i++) {
      const x = Phaser.Math.Between(300, WORLD_W - 300);
      const y = Phaser.Math.Between(300, WORLD_H - 300);
      const npc = this.physics.add.image(x, y, "phys");
      npc.renderId = ++this.nextCellId;
      npc
        .setAlpha(0)
        .setCollideWorldBounds(true)
        .setBounce(1, 1)
        .setDamping(true)
        .setDrag(0.93)
        .setMaxVelocity(140)
        .setDepth(10);
      npc.body.setCircle(16, -14, -14);
      npc.hp = 2;
      npc.genes = new Set();
      npc.palette = NPC_PALS[i % 4];
      npc.shape = ["rod", "coccus", "vibrio", "filament", "short"][i % 5];
      const shuffled = Phaser.Utils.Array.Shuffle([...GENE_KEYS]);
      npc.genes.add(shuffled[0]);
      if (Math.random() < 0.5) npc.genes.add(shuffled[1]);
      npc.wanderDir = Math.random() * Math.PI * 2;
      npc.wanderTimer = 0;
      npc.flagPhase = Math.random() * Math.PI * 2;
      npc.angle = 0;
      this.npcCells.push(npc);
      this.physics.add.overlap(this.player, npc, () => this._collideNPC(npc), null, this);
    }
  }

  _updateNPCs(delta) {
    for (let i = this.npcCells.length - 1; i >= 0; i--) {
      const npc = this.npcCells[i];
      if (!npc.active) {
        this.npcCells.splice(i, 1);
        continue;
      }
      npc.wanderTimer -= delta;
      if (npc.wanderTimer <= 0) {
        npc.wanderDir += (Math.random() - 0.5) * 1.2;
        npc.wanderTimer = 1000 + Math.random() * 2000;
        npc.body.setVelocity(Math.cos(npc.wanderDir) * 70, Math.sin(npc.wanderDir) * 70);
      }
      npc.angle = Phaser.Math.RadToDeg(npc.wanderDir) + 90;
      npc.flagPhase += (0.09 * delta) / 16.667;
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
    const cx = cell.x,
      cy = cell.y;
    if (cell.genes) {
      cell.genes.forEach((key) => {
        const gx = cx + Phaser.Math.Between(-28, 28);
        const gy = cy + Phaser.Math.Between(-28, 28);
        const g = this.geneGroup
          .create(gx, gy, "gene_" + key)
          .setVisible(this.worldView?.mode !== "3d")
          .setDepth(6)
          .setTint(GENES[key].color);
        g.setData("geneKey", key);
        this.tweens.add({
          targets: g,
          y: gy - 6,
          duration: 1400 + Math.random() * 400,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      });
    }
    this.killCount++;
    const flash = this.add.graphics().setDepth(22);
    flash.lineStyle(3, 0xffffff, 0.8);
    flash.strokeCircle(cx, cy, 22);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2.5,
      scaleY: 2.5,
      duration: 350,
      onComplete: () => flash.destroy(),
    });
    cell.destroy();
  }

  _fireBacteriocin() {
    if (!getAbilityAvailability(this, null).burst) return;
    this.energy -= 30;
    this.bacterioTimer = 5000;
    const range = this.activeGenes.has("TOXIN") ? 210 : 140;
    const px = this.player.x,
      py = this.player.y;
    const ring = this.add.graphics().setDepth(18).setPosition(px, py);
    ring.lineStyle(3, 0xff44aa, 1.0);
    ring.strokeCircle(0, 0, 10);
    this.tweens.add({
      targets: ring,
      scaleX: range / 10,
      scaleY: range / 10,
      alpha: 0,
      duration: 440,
      ease: "Power2",
      onComplete: () => ring.destroy(),
    });
    [...this.npcCells, ...this.daughters].forEach((c) => {
      if (c.active && Phaser.Math.Distance.Between(px, py, c.x, c.y) < range) this._killCell(c);
    });
  }

  _startConjugation() {
    const target = findConjugationTarget(
      this.player,
      [...this.daughters, ...this.npcCells],
      this.activeGenes,
    );
    if (!getAbilityAvailability(this, target).conjugate) return;
    this.conjTarget = target;
    this.conjTimer = 0;
  }

  _updateConjugation(delta) {
    if (!this.conjTarget) return;
    if (
      !this.conjTarget.active ||
      Math.hypot(this.player.x - this.conjTarget.x, this.player.y - this.conjTarget.y) >= CONJUGATION_RANGE
    ) {
      this.conjTarget = null;
      this.fxGfx.clear();
      return;
    }
    this.conjTimer += delta;
    const t = this.conjTimer / this.conjDuration;

    this.fxGfx.clear();
    this.fxGfx.lineStyle(2, 0xffff55, 0.4 + Math.sin(t * Math.PI * 6) * 0.4);
    this.fxGfx.lineBetween(this.player.x, this.player.y, this.conjTarget.x, this.conjTarget.y);

    if (this.conjTimer >= this.conjDuration) {
      this.fxGfx.clear();
      const geneArr = [...this.conjTarget.genes].filter((key) => !this.activeGenes.has(key));
      if (geneArr.length > 0 && this.activeGenes.size < 3) {
        const key = geneArr[Math.floor(Math.random() * geneArr.length)];
        if (!this.activeGenes.has(key)) {
          this.activeGenes.add(key);
          this.conjTarget.genes.delete(key);
          this.playerAlpha = 0.4;
          this.time.delayedCall(150, () => {
            this.playerAlpha = 1.0;
          });
        }
      }
      this.conjTarget = null;
    }
  }

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
  }

  _engulf() {
    if (this.engulfing || this.fissioning || this.dying) return;
    this.engulfing = true;
    const resist = this.activeGenes.has("MEMBRANE");
    let pulseCount = resist ? 6 : 2;
    const doPulse = () => {
      if (pulseCount-- <= 0 || !this.alive) {
        if (this.alive) this._lyse("LYSED BY PREDATOR");
        return;
      }
      this.playerAlpha = 0.2;
      this.time.delayedCall(120, () => {
        this.playerAlpha = 1.0;
        this.time.delayedCall(120, doPulse);
      });
    };
    doPulse();
  }

  _lyse(reason) {
    if (!this.alive || this.dying) return;
    this.alive = false;
    this.dying = true;
    this.player.body.setVelocity(0, 0).setAcceleration(0, 0);
    const px = this.player.x,
      py = this.player.y;
    const color = getPlayerPalette(this.activeGenes).outer;
    this.playerAlpha = 0;

    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const frag = this.add.graphics().setDepth(22).setPosition(px, py);
      const fa = a + (Math.random() - 0.5) * 0.5;
      frag.lineStyle(2, color, 0.9);
      frag.beginPath();
      frag.arc(0, 0, 14 + Math.random() * 10, fa, fa + 0.7, false);
      frag.strokePath();
      frag.fillStyle(color, 0.55);
      frag.fillCircle(Math.cos(fa) * 8, Math.sin(fa) * 8, 2);
      const dist2 = 65 + Math.random() * 40;
      this.tweens.add({
        targets: frag,
        x: px + Math.cos(a) * dist2,
        y: py + Math.sin(a) * dist2,
        alpha: 0,
        duration: 680 + Math.random() * 250,
        ease: "Power2",
        onComplete: () => frag.destroy(),
      });
    }
    this.time.delayedCall(800, () => this._showGameOver(reason));
  }

  _implode() {
    if (!this.alive || this.dying) return;
    this.alive = false;
    this.dying = true;
    this.player.body.setVelocity(0, 0).setAcceleration(0, 0);
    const px = this.player.x,
      py = this.player.y;
    const color = getPlayerPalette(this.activeGenes).outer;

    this.fissionScale = { x: 1, y: 1 };
    this.time.addEvent({
      delay: 40,
      repeat: 14,
      callback: () => {
        this.fissionScale.x = Math.max(0, this.fissionScale.x - 0.07);
        this.fissionScale.y = Math.max(0, this.fissionScale.y - 0.07);
      },
    });

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const frag = this.add.graphics().setDepth(22);
      frag.fillStyle(color, 0.75);
      frag.fillCircle(0, 0, 3);
      frag.setPosition(px + Math.cos(a) * 55, py + Math.sin(a) * 55);
      this.tweens.add({
        targets: frag,
        x: px,
        y: py,
        alpha: 0,
        duration: 500,
        ease: "Power2",
        onComplete: () => frag.destroy(),
      });
    }
    this.time.delayedCall(740, () => this._showGameOver("ENERGY DEPLETED"));
  }

  _triggerFission() {
    if (!getAbilityAvailability(this, null).divide) return;
    this.swimInput.reset();
    this.fissioning = true;
    this.fissionProgress = 0;
    this.conjTarget = null;
    this.fxGfx.clear();
    this.player.body.setVelocity(0, 0).setAcceleration(0, 0);
    this.tweens.add({
      targets: this,
      fissionProgress: 1,
      duration: 1200,
      ease: "Sine.easeInOut",
      onComplete: () => this._completeFission(),
    });
  }

  _completeFission() {
    const axis = this.player.rotation - Math.PI / 2;
    const dx = -Math.cos(axis) * 46 * this.viewport.cellScale,
      dy = -Math.sin(axis) * 46 * this.viewport.cellScale;
    this.player.setPosition(
      Phaser.Math.Clamp(this.player.x - dx, 20, WORLD_W - 20),
      Phaser.Math.Clamp(this.player.y - dy, 20, WORLD_H - 20),
    );
    const d = this.physics.add.image(
      Phaser.Math.Clamp(this.player.x + dx * 2, 20, WORLD_W - 20),
      Phaser.Math.Clamp(this.player.y + dy * 2, 20, WORLD_H - 20),
      "phys",
    );
    d.setAlpha(0)
      .setCollideWorldBounds(true)
      .setBounce(1, 1)
      .setDamping(true)
      .setDrag(0.93)
      .setMaxVelocity(200)
      .setDepth(10);
    d.body.setCircle(16, -14, -14);
    d.renderId = ++this.nextCellId;
    d.hp = 3;
    d.genes = new Set(this.activeGenes);
    d.wanderDir = axis + Math.PI;
    d.wanderTimer = 1000;
    d.flagPhase = 0;
    d.angle = Phaser.Math.RadToDeg(this.player.rotation);
    this.daughters.push(d);

    const a = Math.atan2(dy, dx);
    d.body.setVelocity(Math.cos(a) * 120, Math.sin(a) * 120);
    this.player.body.setVelocity(-Math.cos(a) * 80, -Math.sin(a) * 80);
    this.physics.add.overlap(this.player, d, () => this._collideNPC(d), null, this);

    this.divisionCount++;
    this.hud.notify("Division complete · daughter released", this.time.now);
    this.feedGlow = 1;
    this.fissionScale = { x: 1, y: 0.75 };
    this.tweens.add({ targets: this.fissionScale, y: 1, duration: 450, ease: "Sine.easeOut" });
    this.energy = 80;
    this.activeGenes = new Set();
    this.dyingPulse = false;
    this.playerAlpha = 1.0;
    this.fissioning = false;
  }

  _updateDaughters(delta) {
    for (let i = this.daughters.length - 1; i >= 0; i--) {
      const d = this.daughters[i];
      if (!d.active) {
        this.daughters.splice(i, 1);
        continue;
      }
      d.wanderTimer -= delta;
      if (d.wanderTimer <= 0) {
        d.wanderDir += (Math.random() - 0.5) * 1.5;
        d.wanderTimer = 900 + Math.random() * 1500;
        d.body.setVelocity(Math.cos(d.wanderDir) * 80, Math.sin(d.wanderDir) * 80);
      }
      d.angle = Phaser.Math.RadToDeg(d.wanderDir) + 90;
      d.flagPhase += (0.1 * delta) / 16.667;
    }
  }

  _createHUD() {
    this.hud = new CellHUD({
      onDivide: () => this._triggerFission(),
      onBurst: () => this._fireBacteriocin(),
      onConjugate: () => this._startConjugation(),
      onTumble: () => this._tumble(),
      onTogglePause: () => this._togglePause(),
    });
  }

  _updateHUD(time) {
    if (time < this.nextHudUpdate) return;
    this.nextHudUpdate = time + 100;
    this.hud.update(createHudState(this), time);
  }

  _togglePause() {
    if (!this.alive || this.dying || this.showingInstructions) return;
    this.paused = !this.paused;
    this.swimInput.reset();
    this.hud.setPaused(this.paused);
    if (this.paused) this.scene.pause();
    else this.scene.resume();
  }

  _tumble() {
    if (!getAbilityAvailability(this, null).tumble) return;
    this.tumbling = true;
    this.tumbleTimer = 400;
    this.tumbleAngle = (Math.random() < 0.5 ? -1 : 1) * (Math.PI * 0.5 + Math.random() * Math.PI);
    this.player.body.setAcceleration(0, 0);
    const angle = this.thrustAngle + (Math.sign(this.tumbleAngle) * Math.PI) / 2;
    const speed = getSwimmingSpeed(this.activeGenes) * 1.8;
    this.player.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  _setupTouch() {
    this.swimInput = new SwimInput({
      input: this.input,
      guide: new SwimGuide(),
      canSwim: () => canControlCell(this),
    });
  }

  _setupKeyboard() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      fiss: Phaser.Input.Keyboard.KeyCodes.F,
      bact: Phaser.Input.Keyboard.KeyCodes.B,
      conj: Phaser.Input.Keyboard.KeyCodes.C,
    });
  }

  _spawnFood(n, firstPatch) {
    let patch = firstPatch;
    for (let i = 0; i < n; i++) {
      if (i % 12 === 0 && (i > 0 || !patch)) {
        patch = { x: Phaser.Math.Between(150, WORLD_W - 150), y: Phaser.Math.Between(150, WORLD_H - 150) };
      }
      const angle = Math.random() * Math.PI * 2,
        radius = Math.sqrt(Math.random()) * 150;
      this.foodGroup
        .create(
          Phaser.Math.Clamp(patch.x + Math.cos(angle) * radius, 40, WORLD_W - 40),
          Phaser.Math.Clamp(patch.y + Math.sin(angle) * radius, 40, WORLD_H - 40),
          "food",
        )
        .setDepth(5)
        .setVisible(this.worldView?.mode !== "3d")
        .setScale(0.75 + Math.random() * 0.3);
    }
  }

  _spawnGenes(n) {
    for (let i = 0; i < n; i++) {
      const key = GENE_KEYS[i % GENE_KEYS.length];
      const x = Phaser.Math.Between(80, WORLD_W - 80),
        y = Phaser.Math.Between(80, WORLD_H - 80);
      const g = this.geneGroup
        .create(x, y, "gene_" + key)
        .setDepth(6)
        .setVisible(this.worldView?.mode !== "3d")
        .setTint(GENES[key].color);
      g.setData("geneKey", key);
      this.tweens.add({
        targets: g,
        y: y - 7,
        duration: 1500 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  _showInstructions() {
    this.showingInstructions = true;
    this.physics.pause();
    this.hud.root.hidden = true;
    this.closeOverlay = showInstructions({
      isMobile: window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 700,
      onStart: () => {
        this.showingInstructions = false;
        this.physics.resume();
        this.hud.root.hidden = false;
      },
    });
  }

  _showGameOver(reason) {
    this.roundOver = true;
    this.swimInput.reset();
    this.hud.root.hidden = true;
    const elapsed = Math.floor(this.elapsedMs / 1000);
    const score = getRunScore(this.elapsedMs, this.killCount);
    this.closeOverlay?.();
    this.closeOverlay = showGameOver({
      reason,
      elapsed,
      score,
      kills: this.killCount,
      ...loadScoreboard(),
      onPlayAgain: (name) => {
        saveRunScore({ name, score, elapsed, kills: this.killCount, date: Date.now() });
        this.scene.restart();
      },
    });
  }
}
