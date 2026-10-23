import MicroscopeRenderer from "./three/microscope-renderer.mjs";
import { createWorldLayers, renderWorld } from "./world-renderer.mjs";

// Phaser owns the clock. This adapter draws only when that clock supplies new state.
export default function createWorldView({ add, camera, width, height, onModeChange, force2D = false }) {
  let renderer = null;
  let fallback = null;
  let pending = null;
  let dirty = true;
  let destroyed = false;
  const diagnostics = new URLSearchParams(window.location.search).has("stats");
  const stats = diagnostics ? document.createElement("output") : null;
  if (stats) {
    stats.className = "render-stats";
    stats.setAttribute("aria-label", "Rendering diagnostics");
    document.body.appendChild(stats);
  }
  const useFallback = () => {
    if (destroyed || fallback) return;
    const previous = renderer;
    renderer = null;
    previous?.destroy();
    fallback = createWorldLayers(add);
    onModeChange("2d");
    dirty = true;
  };
  if (!force2D) {
    const canvas = document.createElement("canvas");
    try {
      const context = canvas.getContext("webgl2", {
        antialias: true,
        alpha: false,
        stencil: false,
        powerPreference: "low-power",
      });
      if (context)
        renderer = new MicroscopeRenderer({ canvas, context, width, height, onContextLost: useFallback });
    } catch (error) {
      // A denied or exhausted graphics context must not prevent the game starting.
      console.warn("3D rendering unavailable; using the 2D view.", error.message);
      canvas.remove();
    }
  }
  if (!renderer) useFallback();
  else onModeChange("3d");
  let nextStats = 0;
  return {
    get mode() {
      return renderer ? "3d" : "2d";
    },
    update(settings, state, delta) {
      pending = { settings, state, delta };
      dirty = true;
    },
    draw() {
      if (!dirty || !pending || destroyed) return;
      dirty = false;
      const { settings, state, delta } = pending;
      if (renderer) {
        const metrics = renderer.draw(camera, settings, state, delta);
        if (stats && state.elapsedMs >= nextStats) {
          stats.textContent = `${metrics.mode} · ${metrics.fps ? metrics.fps + " fps" : "warming up"} · ${metrics.calls} draws · ${metrics.triangles} triangles · ${metrics.pixelRatio.toFixed(2)}× · ${metrics.geometries} geometries · ${metrics.textures} textures`;
          nextStats = state.elapsedMs + 500;
        }
      } else {
        renderWorld(fallback, camera, settings, state);
        if (stats) stats.textContent = "2D fallback";
      }
    },
    resize(newWidth, newHeight) {
      renderer?.resize(newWidth, newHeight);
      dirty = true;
    },
    destroy() {
      destroyed = true;
      renderer?.destroy();
      if (fallback) Object.values(fallback).forEach((graphics) => graphics.destroy());
      stats?.remove();
    },
  };
}
