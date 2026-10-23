export const STICK_RADIUS = 48;
const DEAD_ZONE = 7;

export function getSwimVector(gesture) {
  if (!gesture) return { x: 0, y: 0 };
  const dx = gesture.x - gesture.startX;
  const dy = gesture.y - gesture.startY;
  const distance = Math.hypot(dx, dy);
  if (distance <= DEAD_ZONE) return { x: 0, y: 0 };
  const power = Math.min(1, (distance - DEAD_ZONE) / (STICK_RADIUS - DEAD_ZONE));
  return { x: (dx / distance) * power, y: (dy / distance) * power };
}

export default class SwimInput {
  constructor({ input, guide, canSwim, lifecycle = globalThis.window }) {
    this.input = input;
    this.guide = guide;
    this.canSwim = canSwim;
    this.lifecycle = lifecycle;
    this.gesture = null;
    this.onDown = (pointer) => {
      if (!canSwim() || this.gesture) return;
      this.gesture = { id: pointer.id, startX: pointer.x, startY: pointer.y, x: pointer.x, y: pointer.y };
    };
    this.onMove = (pointer) => {
      if (this.gesture?.id !== pointer.id) return;
      if (!canSwim()) return this.reset();
      this.gesture.x = pointer.x;
      this.gesture.y = pointer.y;
    };
    this.onUp = (pointer) => {
      if (this.gesture?.id === pointer.id) this.reset();
    };
    this.onOut = () => this.reset();
    input.on("pointerdown", this.onDown);
    input.on("pointermove", this.onMove);
    input.on("pointerup", this.onUp);
    input.on("gameout", this.onOut);
    lifecycle?.addEventListener("blur", this.onOut);
    lifecycle?.addEventListener("touchcancel", this.onOut);
  }

  get vector() {
    if (!this.canSwim()) this.reset();
    return getSwimVector(this.gesture);
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
    this.lifecycle?.removeEventListener("blur", this.onOut);
    this.lifecycle?.removeEventListener("touchcancel", this.onOut);
    this.guide.destroy();
  }
}
