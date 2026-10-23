import { getSwimVector, STICK_RADIUS } from "./swim-input.mjs";
const SVG = "http://www.w3.org/2000/svg";

export default class SwimGuide {
  constructor() {
    this.root = document.createElementNS(SVG, "svg");
    this.root.classList.add("swim-guide");
    this.root.setAttribute("aria-hidden", "true");
    this.circle = document.createElementNS(SVG, "circle");
    this.circle.setAttribute("r", STICK_RADIUS);
    this.circle.setAttribute("fill", "#0b121ccc");
    this.circle.setAttribute("stroke", "#b3c4bf");
    this.circle.setAttribute("stroke-opacity", "0.65");
    this.knob = document.createElementNS(SVG, "circle");
    this.knob.setAttribute("r", "20");
    this.knob.setAttribute("fill", "#ffd078");
    this.root.append(this.circle, this.knob);
    document.body.appendChild(this.root);
    this.clear();
  }

  update(gesture) {
    this.root.classList.toggle("is-active", !!gesture);
    const startX = gesture?.startX ?? Math.max(68, 18 + STICK_RADIUS);
    const startY = gesture?.startY ?? window.innerHeight - 92;
    const vector = getSwimVector(gesture);
    this.circle.setAttribute("cx", startX);
    this.circle.setAttribute("cy", startY);
    this.knob.setAttribute("cx", startX + vector.x * 30);
    this.knob.setAttribute("cy", startY + vector.y * 30);
  }

  clear() {
    this.update(null);
  }

  destroy() {
    this.root.remove();
  }
}
