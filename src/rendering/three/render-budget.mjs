export function getRenderBudget(width, height, deviceRatio = 1, coarsePointer = false) {
  const mobile = coarsePointer || Math.min(width, height) < 760;
  const pixelBudget = mobile ? 850000 : 1500000;
  const pixelRatio = Math.min(deviceRatio, mobile ? 1.25 : 1.5, Math.sqrt(pixelBudget / (width * height)));
  return { mobile, pixelRatio: pixelRatio, ghostCount: mobile ? 64 : 96 };
}

// A fixed camera keeps screen-space input aligned with the gameplay plane.
export function getCameraFrame({ width, height, zoom, scrollX, scrollY }) {
  return {
    width: width / zoom,
    height: height / zoom,
    x: scrollX + width / 2,
    y: -(scrollY + height / 2),
  };
}

export function isInFrame(cell, frame, margin = 170) {
  return (
    Math.abs(cell.x - frame.x) < frame.width / 2 + margin &&
    Math.abs(-cell.y - frame.y) < frame.height / 2 + margin
  );
}

export function getDivisionVertex(x, y, z, progress) {
  const pinch = 1 - 0.97 * progress * Math.exp(-Math.pow(y / 16, 2));
  return [x * pinch, y * (1 + 0.45 * progress), z * pinch];
}
