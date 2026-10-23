import * as T from "../../../vendor/three.mjs";
import { getDivisionVertex } from "./render-budget.mjs";

function capsule(radius, halfLength, segments = 12) {
  const points = [];
  const straight = halfLength - radius;
  for (let i = 0; i <= 32; i++) {
    const y = -halfLength + (i / 32) * halfLength * 2;
    const cap = Math.max(0, Math.abs(y) - straight);
    points.push(new T.Vector2(Math.sqrt(Math.max(0, radius * radius - cap * cap)), y));
  }
  return new T.LatheGeometry(points, segments);
}

export function createCellResources() {
  const dna = [];
  for (let i = 0; i <= 32; i++) {
    const t = i / 32;
    dna.push(new T.Vector3(Math.cos(t * Math.PI * 5) * 2.5, -20 + t * 40, Math.sin(t * Math.PI * 5) * 2.5));
  }
  return {
    rod: capsule(12, 38),
    daughter: capsule(10, 32),
    coccus: new T.SphereGeometry(14, 14, 10),
    short: capsule(14, 25),
    filament: capsule(6, 72, 10),
    vibrio: new T.TubeGeometry(
      new T.CatmullRomCurve3([
        new T.Vector3(0, -35, 0),
        new T.Vector3(11, -12, 0),
        new T.Vector3(11, 12, 0),
        new T.Vector3(0, 35, 0),
      ]),
      20,
      9,
      8,
      false,
    ),
    predator: new T.SphereGeometry(1, 20, 14),
    organelle: new T.SphereGeometry(1, 8, 6),
    nucleoid: new T.TubeGeometry(new T.CatmullRomCurve3(dna), 40, 1.1, 5, false),
  };
}

export function createCellModel(resources, kind, palette, player = false) {
  const group = new T.Group();
  const geometry = player ? resources.rod.clone() : resources[kind] || resources.rod;
  const membrane = new T.MeshPhongMaterial({
    color: palette.outer,
    emissive: palette.peri,
    emissiveIntensity: 0.18,
    specular: 0xffffff,
    shininess: 75,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
  });
  const body = new T.Mesh(geometry, membrane);
  if (kind === "predator") body.scale.set(58, 46, 24);
  group.add(body);

  const nucleusMaterial = new T.MeshBasicMaterial({
    color: palette.nuc,
  });
  const nucleus = new T.Mesh(
    kind === "predator" || kind === "coccus" ? resources.organelle : resources.nucleoid,
    nucleusMaterial,
  );
  nucleus.position.z = kind === "predator" ? 9 : 3;
  if (kind === "predator") nucleus.scale.set(18, 15, 10);
  if (kind === "coccus") nucleus.scale.set(5, 5, 4);
  if (kind === "vibrio") nucleus.position.x = 8;
  group.add(nucleus);
  const secondNucleus = player ? new T.Mesh(resources.nucleoid, nucleusMaterial) : null;
  if (secondNucleus) {
    secondNucleus.visible = false;
    group.add(secondNucleus);
  }
  return {
    group,
    body,
    nucleus,
    secondNucleus,
    membrane,
    nucleusMaterial,
    kind,
    palette,
    player,
    baseVertices: player ? geometry.attributes.position.array.slice() : null,
    divisionProgress: -1,
  };
}

export function updateCellModel(model, cell, scale, state) {
  const { group, body, nucleus, membrane } = model;
  group.position.set(cell.x, -cell.y, 0);
  group.rotation.z = -cell.rotation;
  group.scale.set(scale, -scale, scale);
  group.scale.x *= 1 + Math.sin(state.flagPhase * 0.13 + cell.x) * 0.018;
  group.visible = cell.active !== false;
  if (!model.player) return;

  const alpha = Math.min(1, state.playerAlpha);
  group.visible = alpha > 0 && state.fissionScale.x > 0;
  membrane.color.setHex(state.playerColour);
  membrane.opacity = 0.52 * alpha;
  membrane.emissiveIntensity = 0.18 + state.feedGlow * 0.8;
  model.nucleusMaterial.opacity = alpha;
  model.nucleusMaterial.transparent = alpha < 1;
  group.scale.x *= state.fissionScale.x * (state.activeGenes.has("MEMBRANE") ? 1.15 : 1);
  group.scale.y *= state.fissionScale.y;
  const progress = state.fissioning ? state.fissionProgress : 0;
  if (progress !== model.divisionProgress) {
    const positions = body.geometry.attributes.position;
    const source = model.baseVertices;
    for (let i = 0; i < positions.count; i++) {
      const [x, y, z] = getDivisionVertex(source[i * 3], source[i * 3 + 1], source[i * 3 + 2], progress);
      positions.setXYZ(i, x, y, z);
    }
    positions.needsUpdate = true;
    body.geometry.computeVertexNormals();
    model.divisionProgress = progress;
  }
  nucleus.position.y = -progress * 27;
  if (model.secondNucleus) {
    model.secondNucleus.visible = state.fissioning;
    model.secondNucleus.position.set(0, progress * 27, 3);
  }
}

export function disposeCellModel(model) {
  model.membrane.dispose();
  model.nucleusMaterial.dispose();
  if (model.player) model.body.geometry.dispose();
}
