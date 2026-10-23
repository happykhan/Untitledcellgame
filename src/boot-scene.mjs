import { GENES, GENE_KEYS } from "./config.mjs";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create() {
    // Physics placeholder
    const ph = this.make.graphics({ x: 0, y: 0, add: false });
    ph.fillStyle(0xffffff, 0.01);
    ph.fillRect(0, 0, 4, 4);
    ph.generateTexture("phys", 4, 4);
    ph.destroy();

    // Food: ornate coccus — layered glow + internal granule
    const fg = this.make.graphics({ x: 0, y: 0, add: false });
    fg.lineStyle(12, 0xff8800, 0.1);
    fg.strokeCircle(16, 16, 13);
    fg.lineStyle(6, 0xff8800, 0.22);
    fg.strokeCircle(16, 16, 11);
    fg.fillStyle(0x331a00, 1.0);
    fg.fillCircle(16, 16, 8);
    fg.fillStyle(0xff8800, 0.3);
    fg.fillCircle(16, 16, 7);
    fg.fillStyle(0xff4400, 0.6);
    fg.fillCircle(16, 16, 3.5);
    fg.lineStyle(1.5, 0xff8800, 1.0);
    fg.strokeCircle(16, 16, 7);
    fg.lineStyle(0.8, 0xffcc66, 0.6);
    fg.strokeCircle(16, 16, 8.5);
    fg.generateTexture("food", 32, 32);
    fg.destroy();

    // Gene pickups: diamond/rhombus shape — clearly distinct from round food
    GENE_KEYS.forEach((key) => {
      const c = GENES[key].color;
      const gg = this.make.graphics({ x: 0, y: 0, add: false });
      const cx = 20,
        cy = 20,
        hw = 13,
        hh = 9; // half-width, half-height of diamond
      // Glow
      gg.lineStyle(10, c, 0.1);
      gg.beginPath();
      gg.moveTo(cx, cy - hh - 4);
      gg.lineTo(cx + hw + 4, cy);
      gg.lineTo(cx, cy + hh + 4);
      gg.lineTo(cx - hw - 4, cy);
      gg.closePath();
      gg.strokePath();
      gg.lineStyle(4, c, 0.25);
      gg.beginPath();
      gg.moveTo(cx, cy - hh - 2);
      gg.lineTo(cx + hw + 2, cy);
      gg.lineTo(cx, cy + hh + 2);
      gg.lineTo(cx - hw - 2, cy);
      gg.closePath();
      gg.strokePath();
      // Fill
      gg.fillStyle(c, 0.12);
      gg.fillTriangle(cx, cy - hh, cx + hw, cy, cx - hw, cy);
      gg.fillTriangle(cx, cy + hh, cx + hw, cy, cx - hw, cy);
      // Crisp outline
      gg.lineStyle(2, c, 1.0);
      gg.beginPath();
      gg.moveTo(cx, cy - hh);
      gg.lineTo(cx + hw, cy);
      gg.lineTo(cx, cy + hh);
      gg.lineTo(cx - hw, cy);
      gg.closePath();
      gg.strokePath();
      // Gene symbol inside
      gg.lineStyle(1, c, 0.6);
      gg.lineBetween(cx - 5, cy, cx + 5, cy);
      gg.lineBetween(cx, cy - 4, cx, cy + 4);
      gg.generateTexture("gene_" + key, 40, 40);
      gg.destroy();
    });

    this.scene.start("Game");
  }
}
