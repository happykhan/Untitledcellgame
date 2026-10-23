function createCellAppearance(cell) {
  return {
    x: cell.x,
    y: cell.y,
    rotation: cell.rotation,
    angle: cell.angle,
    active: cell.active,
    flagPhase: cell.flagPhase,
    palette: cell.palette,
    shape: cell.shape,
  };
}

export function createWorldRenderState({
  player,
  predator,
  npcCells,
  daughters,
  activeGenes,
  playerAlpha,
  flagSpeed,
  flagPhase,
  fissionScale,
  fissionProgress,
  fissioning,
  feedGlow,
}) {
  return {
    player: createCellAppearance(player),
    predator: createCellAppearance(predator),
    npcCells: npcCells.map(createCellAppearance),
    daughters: daughters.map(createCellAppearance),
    activeGenes: new Set(activeGenes),
    fissionScale: { ...fissionScale },
    playerAlpha,
    flagSpeed,
    flagPhase,
    fissionProgress,
    fissioning,
    feedGlow,
  };
}
