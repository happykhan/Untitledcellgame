import { GENES } from "../config.mjs";
import {
  findConjugationTarget,
  getUsefulGene,
  getAbilityAvailability,
  getRunScore,
  MAX_ENERGY,
  DIVISION_ENERGY,
  BURST_ENERGY,
  MAX_GENES,
} from "../domain/game-rules.mjs";

export default function createHudState(state) {
  const target = findConjugationTarget(
    state.player,
    [...state.daughters, ...state.npcCells],
    state.activeGenes,
  );
  const available = getAbilityAvailability(state, target);
  const donorGene = getUsefulGene(state.conjTarget || target, state.activeGenes);
  const energy = Math.max(0, Math.floor(state.energy));
  const temperatureStress = state.temp > 42 ? "hot" : state.temp < 30 ? "cold" : "none";
  const temperatureLabels = { hot: "Heat stress", cold: "Cold stress", none: "Optimal" };
  return {
    energy,
    maxEnergy: MAX_ENERGY,
    divisionPercent: (DIVISION_ENERGY / MAX_ENERGY) * 100,
    energyState: state.energy < 30 ? "low" : state.energy > DIVISION_ENERGY ? "ready" : "normal",
    energyCaption: state.fissioning
      ? "Membrane separating…"
      : state.energy > DIVISION_ENERGY
        ? "Division ready · traits inherited"
        : `Feed to divide · over ${DIVISION_ENERGY}`,
    score: getRunScore(state.elapsedMs, state.divisionCount),
    temperature: `${Math.round(state.temp)}°C · ${temperatureLabels[temperatureStress]}`,
    temperatureStress,
    lineage: `${state.divisionCount || 0} descendant${state.divisionCount === 1 ? "" : "s"} produced`,
    goal: state.fissioning
      ? "Copying traits into two cells"
      : state.energy > DIVISION_ENERGY
        ? "Divide to pass on your traits"
        : "Feed to build energy for division",
    genes: [...state.activeGenes].map((key) => ({ key, ...GENES[key] })),
    actions: {
      divide: {
        enabled: available.divide,
        detail: state.fissioning
          ? "Dividing…"
          : available.divide
            ? "Ready"
            : `Over ${DIVISION_ENERGY} energy`,
      },
      burst: {
        enabled: available.burst,
        detail:
          state.bacterioTimer > 0
            ? `${Math.ceil(state.bacterioTimer / 1000)}s cooldown`
            : `Rivals · ${BURST_ENERGY} energy`,
      },
      gene: {
        enabled: available.conjugate,
        detail: state.conjTarget
          ? `Copying ${donorGene ? GENES[donorGene].desc : "gene"}…`
          : state.activeGenes.size >= MAX_GENES
            ? "All slots filled"
            : target
              ? `Copy ${GENES[donorGene].desc}`
              : "Find a nearby cell",
      },
      tumble: { enabled: available.tumble, detail: "Reorient in place" },
    },
  };
}
