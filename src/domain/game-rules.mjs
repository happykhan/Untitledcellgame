export const MAX_ENERGY = 200;
export const DIVISION_ENERGY = 150;
export const BURST_ENERGY = 30;
export const CONJUGATION_RANGE = 140;
export const MAX_GENES = 3;

export function canControlCell({ alive, dying, fissioning, showingInstructions, paused }) {
  return alive && !dying && !fissioning && !showingInstructions && !paused;
}

export function getSwimmingSpeed(genes) {
  let speed = 280;
  if (genes.has("FLAGELLUM")) speed *= 1.4;
  if (genes.has("MEMBRANE")) speed *= 0.85;
  return speed;
}

export function getRunScore(elapsedMs, kills) {
  return Math.floor(elapsedMs / 1000) * 10 + kills * 100;
}

export function findConjugationTarget(player, cells, activeGenes) {
  let nearest = null;
  let nearestDistance = CONJUGATION_RANGE;
  for (const cell of cells) {
    if (!cell.active || ![...cell.genes].some((key) => !activeGenes.has(key))) continue;
    const distance = Math.hypot(player.x - cell.x, player.y - cell.y);
    if (distance < nearestDistance) {
      nearest = cell;
      nearestDistance = distance;
    }
  }
  return nearest;
}

export function getAbilityAvailability(state, conjugationTarget) {
  const controllable = canControlCell(state);
  return {
    divide: controllable && state.energy > DIVISION_ENERGY,
    burst: controllable && state.energy >= BURST_ENERGY && state.bacterioTimer <= 0,
    conjugate: controllable && state.activeGenes.size < MAX_GENES && !state.conjTarget && !!conjugationTarget,
    tumble: controllable && !state.tumbling,
  };
}
