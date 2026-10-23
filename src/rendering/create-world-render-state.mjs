function createCellAppearance(cell) {
  return {
    renderId: cell.renderId,
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
  turnRate,
  flagPhase,
  fissionScale,
  fissionProgress,
  fissioning,
  feedGlow,
  elapsedMs,
  temp,
  foodGroup,
  geneGroup,
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
    turnRate,
    flagPhase,
    fissionProgress,
    fissioning,
    feedGlow,
    elapsedMs,
    temperature: temp,
    food: foodGroup
      .getChildren()
      .filter((item) => item.active)
      .map((item) => ({ x: item.x, y: item.y, scale: item.scaleX })),
    genePickups: geneGroup
      .getChildren()
      .filter((item) => item.active)
      .map((item) => ({ x: item.x, y: item.y, key: item.getData("geneKey") })),
  };
}
