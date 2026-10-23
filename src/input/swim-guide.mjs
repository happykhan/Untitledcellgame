const SVG = "http://www.w3.org/2000/svg";

export default class SwimGuide {
  constructor() {
    this.root = document.createElementNS(SVG, "svg");
    this.root.classList.add("swim-guide");
    this.root.setAttribute("aria-hidden", "true");
    this.circle = document.createElementNS(SVG, "circle");
    this.circle.setAttribute("r", "24");
    this.circle.setAttribute("fill", "none");
    this.circle.setAttribute("stroke", "#c5e6df");
    this.circle.setAttribute("stroke-opacity", "0.35");
    this.path = document.createElementNS(SVG, "path");
    this.path.setAttribute("fill", "none");
    this.path.setAttribute("stroke", "#ffd078");
    this.path.setAttribute("stroke-width", "2");
    this.path.setAttribute("stroke-linecap", "round");
    this.root.append(this.circle, this.path);
    document.body.appendChild(this.root);
    this.clear();
  }

  update(gesture) {
    if (!gesture) {
      this.clear();
      return;
    }
    this.root.style.display = "block";
    const { startX, startY, x, y } = gesture;
    const angle = Math.atan2(y - startY, x - startX);
    this.circle.setAttribute("cx", startX);
    this.circle.setAttribute("cy", startY);
    this.path.setAttribute(
      "d",
      `M${startX},${startY} L${x},${y} M${x - Math.cos(angle - 0.45) * 11},${y - Math.sin(angle - 0.45) * 11} L${x},${y} L${x - Math.cos(angle + 0.45) * 11},${y - Math.sin(angle + 0.45) * 11}`,
    );
  }

  clear() {
    this.root.style.display = "none";
  }
  destroy() {
    this.root.remove();
  }
}
