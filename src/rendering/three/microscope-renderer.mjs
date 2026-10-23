import * as T from "../../../vendor/three.mjs";
import { GENES } from "../../config.mjs";
import { PAL, getPlayerPalette } from "../palettes.mjs";
import { createCellResources, createCellModel, updateCellModel, disposeCellModel } from "./cell-models.mjs";
import {
  createInstanceBatch,
  createFilaments,
  createFluidBackground,
  disposeScene,
} from "./scene-decoration.mjs";
import { getRenderBudget, getCameraFrame, isInFrame } from "./render-budget.mjs";

export default class MicroscopeRenderer {
  constructor({ canvas, context, width, height, onContextLost }) {
    this.canvas = canvas;
    this.context = context;
    canvas.className = "world-3d";
    canvas.setAttribute("aria-hidden", "true");
    this.renderer = new T.WebGLRenderer({
      canvas,
      context,
      antialias: true,
      alpha: false,
      stencil: false,
      powerPreference: "low-power",
    });
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.scene = new T.Scene();
    this.camera = new T.OrthographicCamera(-1, 1, 1, -1, 1, 1400);
    this.camera.position.z = 600;
    this.scene.add(new T.HemisphereLight(0xd5f1ec, 0x0b1d2c, 1.3));
    const key = new T.DirectionalLight(0xfff0d1, 2.2);
    key.position.set(-250, 350, 450);
    this.scene.add(key);
    const fill = new T.DirectionalLight(0x72b5c9, 0.8);
    fill.position.set(300, -120, 250);
    this.scene.add(fill);
    this.resources = createCellResources();
    this.models = new Map();
    this.resize(width, height);
    this.background = createFluidBackground(this.scene, this.budget.ghostCount);
    this.food = createInstanceBatch(
      this.scene,
      this.resources.organelle,
      new T.MeshPhongMaterial({
        color: 0xffffff,
        emissive: 0xd65e11,
        emissiveIntensity: 0.55,
        shininess: 55,
      }),
      300,
    );
    this.genes = createInstanceBatch(
      this.scene,
      new T.OctahedronGeometry(1),
      new T.MeshPhongMaterial({ color: 0xffffff, shininess: 85, emissive: 0x183b2c, emissiveIntensity: 0.4 }),
      200,
    );
    this.granules = createInstanceBatch(
      this.scene,
      this.resources.organelle,
      new T.MeshLambertMaterial({ color: 0xffffff, emissive: 0x1b150c, emissiveIntensity: 0.3 }),
      512,
    );
    this.filaments = createFilaments(this.scene);
    this.frameCount = 0;
    this.averageDelta = 16.667;
    this.lost = (event) => {
      event.preventDefault();
      onContextLost();
    };
    canvas.addEventListener("webglcontextlost", this.lost);
    document.body.prepend(canvas);
  }

  resize(width, height) {
    this.budget = getRenderBudget(
      width,
      height,
      window.devicePixelRatio || 1,
      window.matchMedia("(pointer: coarse)").matches,
    );
    this.pixelRatio = this.budget.pixelRatio;
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(width, height, false);
  }

  draw(phaserCamera, settings, state, delta) {
    const frame = getCameraFrame(phaserCamera);
    const camera = this.camera;
    camera.left = -frame.width / 2;
    camera.right = frame.width / 2;
    camera.top = frame.height / 2;
    camera.bottom = -frame.height / 2;
    camera.position.set(frame.x, frame.y, 600);
    camera.updateProjectionMatrix();
    const time = state.elapsedMs / 1000;
    this.background.update(time, state.temperature);
    const appearance = { ...state, playerColour: getPlayerPalette(state.activeGenes).outer };
    const seen = new Set();
    this.granules.begin();
    this.filaments.begin();
    this.drawCell("player", state.player, "rod", PAL.player, settings.cellScale, appearance, frame, seen);
    this.drawCell(
      "predator",
      state.predator,
      "predator",
      PAL.predator,
      settings.cellScale,
      appearance,
      frame,
      seen,
    );
    for (const cell of state.npcCells)
      this.drawCell(
        `npc-${cell.renderId}`,
        cell,
        cell.shape,
        cell.palette,
        settings.cellScale,
        appearance,
        frame,
        seen,
      );
    for (const cell of state.daughters)
      this.drawCell(
        `daughter-${cell.renderId}`,
        cell,
        "daughter",
        PAL.daughter,
        settings.cellScale,
        appearance,
        frame,
        seen,
      );
    for (const [id, model] of this.models) {
      if (seen.has(id)) continue;
      this.scene.remove(model.group);
      disposeCellModel(model);
      this.models.delete(id);
    }
    this.granules.end();
    this.filaments.end();
    this.food.begin();
    for (const item of state.food) {
      if (!isInFrame(item, frame, 30)) continue;
      const radius = (7.5 + Math.sin(time * 1.5 + item.x) * 0.35) * item.scale;
      this.food.add(item.x, -item.y, 3, radius, radius, radius * 0.7, 0xffc16d);
    }
    this.food.end();
    this.genes.begin();
    for (const item of state.genePickups) {
      if (isInFrame(item, frame, 30))
        this.genes.add(item.x, -item.y, 5, 14, 10, 6, GENES[item.key].color, time * 0.6);
    }
    this.genes.end();
    this.renderer.render(this.scene, this.camera);
    this.frameCount++;
    if (this.frameCount > 60 && delta > 0 && delta < 150)
      this.averageDelta += (delta - this.averageDelta) * 0.025;
    if (this.frameCount % 180 === 0 && this.averageDelta > 26) {
      this.pixelRatio = Math.max(this.budget.pixelRatio * 0.65, this.pixelRatio * 0.85);
      this.renderer.setPixelRatio(this.pixelRatio);
    }
    return {
      mode: "3D",
      fps: this.frameCount > 60 ? Math.round(1000 / this.averageDelta) : null,
      calls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      pixelRatio: this.pixelRatio,
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
    };
  }

  drawCell(id, cell, kind, palette, scale, state, frame, seen) {
    if (cell.active === false || !isInFrame(cell, frame)) return;
    seen.add(id);
    let model = this.models.get(id);
    if (!model) {
      model = createCellModel(this.resources, kind, palette, id === "player");
      this.models.set(id, model);
      this.scene.add(model.group);
    }
    updateCellModel(model, cell, scale, state);
    if (!model.group.visible) return;
    const colour = id === "player" ? state.playerColour : palette.outer;
    const cos = Math.cos(cell.rotation),
      sin = Math.sin(cell.rotation);
    const count = kind === "predator" ? 10 : kind === "coccus" ? 4 : 8;
    const halfLength = kind === "predator" ? 35 : kind === "coccus" ? 8 : kind === "short" ? 14 : 42;
    for (let i = 0; i < count; i++) {
      const x = Math.sin(i * 4.2 + state.flagPhase * 0.05) * (kind === "predator" ? 35 : 5);
      const y = Math.cos(i * 2.7) * halfLength;
      const r = kind === "predator" ? 4 + (i % 3) : 1.7 + (i % 3) * 0.35;
      this.granules.add(
        cell.x + (x * cos - y * sin) * scale,
        -cell.y - (x * sin + y * cos) * scale,
        kind === "predator" ? 12 : 5,
        r * scale,
        r * scale * 1.4,
        r * scale,
        i % 2 ? palette.nuc : palette.ribo,
      );
    }
    if (kind === "predator") {
      if (Math.hypot(cell.x - state.player.x, cell.y - state.player.y) < 230)
        this.drawPseudopods(cell, state, scale);
      return;
    }
    if (kind === "coccus") return;
    const rear = { rod: 62, daughter: 50, short: 25, filament: 72, vibrio: 36 }[kind] || 62;
    const strands = id === "player" && state.activeGenes.has("FLAGELLUM") ? 2 : 1;
    for (let strand = 0; strand < strands; strand++) {
      let px = cell.x - Math.sin(cell.rotation) * rear * scale;
      let py = -cell.y - Math.cos(cell.rotation) * rear * scale;
      for (let i = 1; i <= 18; i++) {
        const t = i / 18;
        const wave =
          Math.sin((cell.flagPhase ?? state.flagPhase) + t * 8 + strand * 2) * 4 * (1 - t * 0.4) + strand * 4;
        const x = cell.x + (-sin * (rear + t * 58) + cos * wave) * scale;
        const y = -cell.y - (cos * (rear + t * 58) + sin * wave) * scale;
        this.filaments.segment(px, py, 0, x, y, 0, colour);
        px = x;
        py = y;
      }
    }
  }

  drawPseudopods(cell, state, scale) {
    const direction = Math.atan2(state.player.y - cell.y, state.player.x - cell.x);
    for (let arm = -1; arm <= 1; arm++) {
      const angle = direction + arm * 0.45;
      let px = cell.x,
        py = -cell.y;
      for (let i = 1; i <= 16; i++) {
        const length = (40 + i * 4) * scale;
        const wave = Math.sin(i * 0.4 + state.flagPhase) * 5;
        const x = cell.x + Math.cos(angle) * length + Math.sin(angle) * wave;
        const y = -cell.y - Math.sin(angle) * length + Math.cos(angle) * wave;
        this.filaments.segment(px, py, 4, x, y, 4, 0xfb9275);
        px = x;
        py = y;
      }
    }
  }

  destroy() {
    this.canvas.removeEventListener("webglcontextlost", this.lost);
    disposeScene(this.scene, Object.values(this.resources));
    this.models.clear();
    this.renderer.dispose();
    if (!this.context.isContextLost()) this.renderer.forceContextLoss();
    this.canvas.remove();
  }
}
