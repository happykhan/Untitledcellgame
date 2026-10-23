export default class SwimInput {
  constructor({ input, guide, canSwim, onStroke }) {
    this.input = input;
    this.guide = guide;
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
    this.guide.clear();
  }

  draw() {
    this.guide.update(this.gesture);
  }

  destroy() {
    this.input.off("pointerdown", this.onDown);
    this.input.off("pointermove", this.onMove);
    this.input.off("pointerup", this.onUp);
    this.input.off("gameout", this.onOut);
    this.guide.destroy();
  }
}
