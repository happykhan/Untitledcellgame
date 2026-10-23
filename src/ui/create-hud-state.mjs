import { GENES } from "../config.mjs";
import {
  findConjugationTarget,
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
  const daughterCount = state.daughters.filter((cell) => cell.active).length;
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
        ? "Ready to divide"
        : `Feed to divide · over ${DIVISION_ENERGY}`,
    score: getRunScore(state.elapsedMs, state.killCount),
    temperature: `${Math.round(state.temp)}°C · ${temperatureLabels[temperatureStress]}`,
    temperatureStress,
    lineage: state.divisionCount
      ? `${state.divisionCount} division${state.divisionCount === 1 ? "" : "s"} · ${daughterCount} daughter${daughterCount === 1 ? "" : "s"}`
      : "First generation",
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
            : `${BURST_ENERGY} energy`,
      },
      gene: {
        enabled: available.conjugate,
        detail: state.conjTarget
          ? "Transferring…"
          : state.activeGenes.size >= MAX_GENES
            ? "All slots filled"
            : target
              ? "Cell in reach"
              : "Find a nearby cell",
      },
      tumble: { enabled: available.tumble, detail: "Change direction" },
    },
  };
}
