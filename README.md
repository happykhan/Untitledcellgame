# Untitled Cell Game

A simplified learning game about bacterial survival, adaptation and reproduction. You play as a *Bacillus* bacterium navigating a microscopic world full of nutrients, rival bacteria, and a eukaryotic predator.

Built with Phaser 3 gameplay and a Three.js microscopy renderer. No build step or package installation required. Serve the files over HTTP.

**Play now:** https://cellgame-eight.vercel.app

---

## Gameplay

Grow your lineage by finding nutrients, coping with environmental stress and reproducing. A successful division produces a descendant that inherits your traits. The score gives 1,000 points per descendant plus one point per second survived; killing rivals earns no points.

- **Energy bar** — drains over time and with movement. Eat orange nutrient particles to refill.
- **Temperature** — cycles between optimal (37°C), heat stress (55–70°C) and cold stress (10–20°C). Off-optimal temperatures multiply energy drain.
- **Fluid motion** — the body turns before thrust follows its long axis. Strong drag damps sideways slip; releasing the control lets the cell settle into the ambient current. Tumble briefly reorients in place.
- **Lineage** — the persistent goal shows descendants produced and the next action. Earlier kill-based scores stay stored separately from the new lineage leaderboard.

### Genes

Take up floating DNA through **transformation**, or copy a useful trait from a living neighbour through **conjugation**. The donor retains its copy. The model allows three traits at once; both cells keep their traits after fission.

| Symbol | Gene | Effect |
|--------|------|--------|
| H | Heat Shock Proteins | Halve drain during high temp |
| C | Cold Shock Proteins | Halve drain during low temp |
| F | Extra Flagellum | +40% speed, slight extra drain |
| M | Thick Membrane | More time to swim clear of a predator, −15% speed |
| T | Toxin Secretion | Larger bacteriocin range |

### Mechanics

- **NPC bacteria** — wander the world; each carries 1–2 genes. They compete for nutrients and can donate useful genes. Fast repeated contacts or bacteriocin can kill rivals and release DNA, but do not earn points.
- **Predator** (large red eukaryote) — chases when close. Contact starts engulfment; swim clear before it completes. The Protection trait gives more escape time.
- **Fission** (F / DIVIDE button) — requires energy > 150. Splits you into two cells; both cells retain your traits, and the daughter wanders and feeds. The membrane constricts and the two cells separate along the swimming axis. Your remaining energy is halved; your adaptation slots stay filled.
- **Bacteriocin** (B) — fires an expanding antimicrobial ring; affects nearby rival bacteria and spares descendants. 5-second cooldown, costs 30 energy. Toxin gene increases range.
- **Conjugation** (C) — extend a pilus to a nearby cell and copy one of its useful genes without removing the donor copy. Takes ~2 seconds; requires proximity.

---

## Controls

### Mobile
- **Hold and drag** the water to aim your swimming direction. The cell turns and then swims along its body axis. Short drags swim slowly; longer drags reach full speed. Release to stop active swimming; ambient flow remains. The stick follows your first finger.
- **Tumble / Conjugate / Burst / Divide** sit in a right-thumb cluster. Use a second finger for abilities while steering. Disabled buttons indicate unavailable abilities.
- **Pause** at the top-right freezes the world. Switching away from the tab also pauses it.

### Desktop
| Key | Action |
|-----|--------|
| W / ↑ | Aim up and swim |
| S / ↓ | Aim down and swim |
| A / ← | Aim left and swim |
| D / → | Aim right and swim |
| Space | Tumble |
| F | Fission |
| B | Bacteriocin |
| C | Conjugation |

---

## Visual design

The main world uses a fixed orthographic Three.js camera with flat gameplay movement:

- **Player**: a gold translucent cell, coiled nucleoid and moving intracellular granules.
- **NPCs**: teal, rose, green and violet rods, cocci, curved cells and filaments.
- **Predator**: a coral cell with a visible nucleus, internal bodies and reaching pseudopods.
- **Division**: the player's own 3D membrane stretches and constricts before the daughter separates.
- **Water**: a dim fluid field, batched background organisms and soft depth particles.

Mobile rendering uses capped drawing-buffer pixels, shared geometry, instanced pickups/granules, batched flagella and a single lighting pass. No shadow maps, transmission/refraction or full-screen blur are used. The native HUD and SVG steering stick stay at screen resolution. The world stops submitting frames during pause and after a round finishes.

If WebGL2 is unavailable or its context is lost, the existing 2D view takes over. Restart tries 3D again. Phone-sized browser checks have passed; physical-phone frame time and battery usage have not been measured.

---

## Running locally

The game uses native browser modules. Serve the repository over HTTP:

```
python3 -m http.server 8080
```

Then visit `http://localhost:8080`. Phaser 3 loads from CDN. Opening `index.html` directly is not supported; offline startup is not implemented.

---

## Tech stack

- [Phaser 3](https://phaser.io/) — gameplay, Arcade physics and lightweight Canvas effects (CDN)
- [Three.js 0.186.1](https://threejs.org/) — locally vendored 3D world renderer, MIT licensed
- Native JavaScript modules in `src/`, with a small `game.js` entry point and `hud.css` — no build step
- Deploys automatically to [Vercel](https://vercel.com) from this repo

---

## Contributing

Pull requests welcome. The code separates gameplay, rendering and interface ownership:

| Module | Responsibility |
|--------|----------------|
| `game.js` | Engine boot and viewport observer |
| `src/game-scene.mjs` | Phaser simulation, actions and scene lifecycle |
| `src/domain/game-rules.mjs` | Shared action rules, swimming speed and scoring |
| `src/rendering/` | Cell geometry, palettes and world drawing from appearance snapshots |
| `src/ui/` | HUD display values, DOM controls and run screens |
| `src/input/swim-input.mjs` | Held steering ownership, cancellation and event cleanup |
| `src/domain/score-store.mjs` | Validated local high-score persistence |

The HUD receives display data and named callbacks rather than the simulation scene. Rendering receives appearance snapshots without physics bodies. See [architecture notes](docs/architecture.md) for the rendering decision and remaining integration boundaries.

Ideas for contribution:
- More pathogen types (spirochetes, vibrio, cocci clusters)
- Multiplayer via WebRTC
- Biofilm formation mechanic
- Quorum sensing — coordinate with NPC cells
- CRISPR defence against phage pickups

---

## Licence

MIT

## Checks

Run the gameplay regression checks with Node.js (only needed for development):

```
node --test tests/*.test.mjs
```

Food appears in patches. Nutrient collection animates into the cell, intracellular granules move, and turning eases towards the direction of travel. The native HUD stays independent of the game camera zoom.

## Renderer checks

Append `?stats=1` for opt-in frame-rate, draw-call, triangle and resource diagnostics. These are browser/engine observations, not a physical-phone or GPU-timer benchmark. `?renderer=2d` exercises the fallback. Both flags are development aids; the default game has no diagnostics panel.

The renderer receives appearance snapshots and uses the Phaser scene clock. The 3D view does not start its own animation loop. See [architecture notes](docs/architecture.md) and [vendor provenance](vendor/README.md).


## Learning intent and model limits

The loop connects nutrient uptake to energy, energy to reproduction, and reproduction to inheritance. Temperature tolerance and motility illustrate that traits have context-dependent benefits and costs. Living neighbours offer a non-lethal route to a useful trait through conjugation; loose DNA uptake is labelled transformation. Bacteriocin illustrates costly competition for shared nutrients. Protective-envelope behaviour gives time to escape predation in this model.

This is a deliberately simplified learning game, not a validated biological simulator. A single abstract trait represents many possible molecular mechanisms. Transfer compatibility, nutrient chemistry, mutation, population genetics and offspring energy budgets are not modelled. Three trait slots, timed environmental stress, predator escape timing, selectable swimming directions and scores are gameplay abstractions. There is no claim that all bacteria can acquire every depicted trait or that all envelopes protect against predation. Daughters feed and wander but do not autonomously divide or experience the full player survival model.

The swimming model takes its qualitative reference from forward runs, brief reorientation and strong viscous drag described in [Hydrodynamics and direction change of tumbling bacteria](https://www.repository.cam.ac.uk/items/57235bb4-18bc-4587-8c3f-1d6de2c36835). It is tuned for mobile play rather than reproducing measured bacterial trajectories.
