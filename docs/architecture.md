# Rendering and code ownership

The game uses Phaser 3 for gameplay, Arcade bodies, input and small transient effects, with a locally vendored Three.js 0.186.1 world renderer. Native modules require HTTP hosting. No package installation or build step is needed to run the site.

## One owner per responsibility

A native button invokes a named callback supplied by GameScene. Keyboard commands invoke the same operation. Both command guards and HUD display values use `getAbilityAvailability`. Held pointer input supplies a dead-zone filtered, capped direction vector; the scene applies shared swimming speed with frame-rate independent response and release braking. WASD/arrows supply a normalised direction. Three Phaser pointers support abilities while steering; cancellation and focus loss clear the gesture.

GameScene owns active simulation time. HUD and final score use `getRunScore`; neither adjusts the clock using wall time. The scene submits appearance snapshots to the world view. The world is drawn on the Phaser scene's render event, after its camera updates. This keeps 3D objects and 2D effect positions aligned and avoids a second animation loop.

The Three.js canvas is the only WebGL context. Phaser uses a transparent Canvas renderer above it for transient effects and pointer input. The DOM HUD and SVG steering guide remain independent of camera zoom and rendering resolution.

## 3D appearance

`createWorldRenderState` copies positions, shapes, palettes, pickup appearances and division values without exposing physics bodies. The renderer owns model geometry and material lifecycles. The fixed orthographic camera maps the same plane and zoom as Phaser, while shared lighting and rounded meshes give the cells volume.

The player owns a deformable membrane mesh; division never alters the geometry shared by NPCs. Each nucleus is rendered within the membrane. Intracellular granules and pickups are instanced, and all flagella/pseudopod lines share one dynamic batch. Offscreen cell models are removed and their private materials disposed. Shared shape resources remain available until scene shutdown.

## Mobile budget

Phone/coarse-pointer views cap device pixel ratio at 1.25 and the 3D drawing buffer at 850,000 pixels. Other views cap at 1.5 and 1,500,000 pixels. Slower sustained frames can reduce rendering resolution further. HUD text and touch controls retain their native resolution. Draw buffers adapt on orientation changes.

Lighting uses hemisphere and directional lights without shadow maps, physical transmission/refraction or postprocessing passes. Background organisms are one static instanced batch; depth particles use one small procedural texture. The renderer submits no new frames during scene pause, on the instructions screen after its initial draw, or behind a completed round's score screen.

Physics, input and scene updates still run through Phaser. The graphics limits do not establish physical-phone performance or battery life; those require device testing.

## Recovery and disposal

WebGL2 denial or context loss switches the same simulation to the retained 2D view. Pickup visibility is switched with the renderer so hidden simulation objects stay visible in the fallback. A restart tries a fresh 3D context.

Scene shutdown disposes shared and private geometry, materials, instanced buffers and textures; removes the world canvas, steering guide and DOM overlays; and unsubscribes render/document/pointer listeners. The 3D context is released when it is still live. One restarted scene has one world canvas, one Phaser canvas, one HUD and one steering guide.

## Verification

Run `node --test tests/*.test.mjs`. Tests cover gameplay boundaries, inherited genes, shape deformation, render-state isolation, pixel budgets at phone/high-DPI/landscape dimensions, coordinate mapping, batch capacity and shared disposal. Browser checks cover actual rendering, phone/landscape layouts, held steering, division, pause, restart and forced context loss.

Append `?stats=1` for opt-in engine frame-rate, draw-call, triangle and resource readings. Append `?renderer=2d` to exercise the fallback without WebGL. Neither flag appears in the default play UI.

## Sources

- Phoenix Trader's local `src/town/world.ts`, `src/town/TownScene.tsx` and `docs/town-rendering.md` were inspected read only for the dimensional rendering approach.
- [Three.js orthographic camera](https://threejs.org/docs/pages/OrthographicCamera.html)
- [Three.js instancing](https://threejs.org/docs/pages/InstancedMesh.html)
- [Three.js WebGL renderer](https://threejs.org/docs/pages/WebGLRenderer.html)
- [Phaser Graphics tradeoffs](https://docs.phaser.io/phaser/concepts/gameobjects/graphics)
