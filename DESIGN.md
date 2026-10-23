# Microscopy view

This extends the established game while retaining its identity. Gold identifies the player, coral/red identifies the predator, and cyan, violet, rose and green distinguish competing cells. Nutrients remain amber and adaptations remain coloured diamonds.

The approved direction is shallow 3D with a fixed orthographic camera. Rounded, lightly translucent membranes, coiled nucleoids, intracellular granules and fine moving flagella give cells physical presence. A dark fluid field and dim particles provide depth without obscuring playable objects.

Use shared geometry, instanced pickups and intracellular granules, a single filament batch and restrained lighting. Avoid shadow maps, physical transmission/refraction and full-screen postprocessing on the mobile path. Cap drawing-buffer pixels; keep text and controls at native screen resolution. Scene pause and round completion must stop 3D submissions. Fall back to the retained 2D view if WebGL2 is unavailable or its context is lost.

Keep the authored action icons. Hold-and-drag steering responds while pressed and brakes on release. A floating stick shows the first finger position, with a resting cue at bottom left and four abilities in the right thumb cluster. WASD and arrows set the desired swim direction. The shorter rod turns first, then propels along its long axis. Strong drag limits sideways slip; idle cells follow the fluid. Phone controls are at least 44 pixels high; the steering guide is drawn in screen coordinates independent of camera zoom. Do not place renderer diagnostics in the default play experience.

The persistent goal is to grow a lineage. Show descendants produced and the next feeding/division step. Trait slots name their benefit, conjugation previews the trait to copy, and short event messages explain inheritance, DNA uptake and stress. Avoid a kill-based reward loop.
