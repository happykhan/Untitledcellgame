# Rendering and code ownership

The current game retains Phaser 3 and its 2D microscopy appearance. This refactor does not migrate the renderer to Three.js or introduce a build system. Native modules require HTTP hosting; they no longer depend on global script order.

## Control and display flow

A native button invokes a named callback supplied by GameScene. Keyboard commands invoke the same scene operation. Both the operation and the HUD selector use `getAbilityAvailability`, so action thresholds and lifecycle gates have one owner. Swipe input delivers a displacement; the scene applies the shared swimming-speed calculation.

GameScene advances active simulation time. HUD and final-score calculation both use `getRunScore`; neither modifies the scene clock or derives survival time from wall time. Pause stops scene updates, while the DOM resume control remains active. Death stops gameplay and scoring but leaves rendering active until the death animation finishes.

`createWorldRenderState` copies cell positions and appearance fields, adaptation keys and division shape values into a snapshot. It excludes physics bodies and scene methods. `renderWorld` draws this snapshot and skips offscreen NPC/daughter geometry. The renderer does not update animation phases or other gameplay state.

Scene shutdown removes document and pointer subscriptions, cancels screen focus timers and removes DOM overlays. Phaser owns the graphics objects created through its scene factory.

## Visual direction

Phoenix Trader's town implementation uses Three.js geometry, an orthographic camera, shared lighting and ambient occlusion. The cell game currently reconstructs detailed 2D Graphics geometry each frame. Phaser itself can support richer artwork, but adding more linework to this renderer will not provide the same sense of volume and material.

For a substantial visual upgrade, the preferred experiment is a shallow 3D microscopy scene: keep movement and collisions on a plane, use rounded cell meshes, restrained translucent materials, shared lighting and depth layers. A fixed orthographic camera preserves the current spatial controls. This is a proposed next experiment, not an implemented feature or a claim of scientific accuracy.

A shader/sprite-based Phaser renderer is also a viable lower-cost direction if mobile performance and a strictly 2D look take priority. Phaser's Graphics documentation explicitly notes the cost of decomposing complex paths and suggests baked textures for sufficiently static content. Moving every animated membrane into a newly generated texture each frame would be the wrong application of that advice.

Before selecting Three.js for the main game, compare the same player, predator, NPC population and division sequence on desktop and a physical phone. Check transparency ordering, focal blur versus threat readability, frame time and battery behaviour. Three.js physical transmission has a per-pixel cost; attractive isolated cell renders do not establish whole-game performance.

## Remaining integration boundary

The simulation still uses Phaser Arcade bodies, generated pickup textures and Phaser tweens for transient effects. The appearance snapshot isolates the main world renderer; it is not a claim that a Three.js renderer can be dropped in without adapting those effect and camera integrations. Do not retain two permanent game loops with independent clocks.

## Sources inspected

- Phoenix Trader: `src/town/TownScene.tsx`, `src/town/world.ts`, `docs/town-rendering.md` in the local project, read only.
- [Phaser Graphics](https://docs.phaser.io/phaser/concepts/gameobjects/graphics)
- [Three.js orthographic camera](https://threejs.org/docs/pages/OrthographicCamera.html)
- [Three.js physical material](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)
