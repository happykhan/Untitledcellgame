export default class SwimInput {
  constructor({ input, graphics, canSwim, onStroke }) {
    this.input = input;
    this.graphics = graphics;
    this.gesture = null;
    this.onDown = (pointer) => {
      if (!canSwim() || this.gesture) return;
      this.gesture = { id: pointer.id, startX: pointer.x, startY: pointer.y, x: pointer.x, y: pointer.y };
    };
    this.onMove = (pointer) => {
      if (this.gesture?.id !== pointer.id) return;
      this.gesture.x = pointer.x;
      this.gesture.y = pointer.y;
    };
    this.onUp = (pointer) => {
      if (this.gesture?.id !== pointer.id) return;
      const { startX, startY } = this.gesture;
      this.reset();
      const dx = pointer.x - startX;
      const dy = pointer.y - startY;
      if (canSwim() && Math.hypot(dx, dy) > 14) onStroke(dx, dy);
    };
    this.onOut = () => this.reset();
    input.on("pointerdown", this.onDown);
    input.on("pointermove", this.onMove);
    input.on("pointerup", this.onUp);
    input.on("gameout", this.onOut);
  }

  reset() {
    this.gesture = null;
    this.graphics.clear();
  }

  draw() {
    const g = this.graphics;
    g.clear();
    if (!this.gesture) return;
    const { startX, startY, x, y } = this.gesture;
    g.lineStyle(1.5, 0xffffff, 0.12);
    g.strokeCircle(startX, startY, 28);
    if (Math.hypot(x - startX, y - startY) <= 6) return;
    g.lineStyle(2, 0xffd060, 0.5);
    g.lineBetween(startX, startY, x, y);
    const angle = Math.atan2(y - startY, x - startX);
    g.fillStyle(0xffd060, 0.6);
    g.fillTriangle(
      x,
      y,
      x - Math.cos(angle - 0.4) * 12,
      y - Math.sin(angle - 0.4) * 12,
      x - Math.cos(angle + 0.4) * 12,
      y - Math.sin(angle + 0.4) * 12,
    );
  }

  destroy() {
    this.input.off("pointerdown", this.onDown);
    this.input.off("pointermove", this.onMove);
    this.input.off("pointerup", this.onUp);
    this.input.off("gameout", this.onOut);
    this.graphics.destroy();
  }
}
