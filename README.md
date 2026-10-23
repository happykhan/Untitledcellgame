# Untitled Cell Game

A scientifically accurate single-cell survival game in the browser. You play as a *Bacillus* bacterium navigating a microscopic world full of nutrients, rival bacteria, and a eukaryotic predator.

Built with Phaser 3. No build step or package installation required. Serve the files over HTTP.

**Play now:** https://cellgame-eight.vercel.app

---

## Gameplay

Survive as long as possible by eating food, collecting genes, and avoiding (or outsmarting) the predator.

- **Energy bar** — drains over time and with movement. Eat orange nutrient particles to refill.
- **Temperature** — cycles between optimal (37°C), heat stress (55–70°C) and cold stress (10–20°C). Off-optimal temperatures multiply energy drain.
- **Ocean current** — slow background drift; compass arrow (bottom-left) shows direction.
- **Score** — time × 10 + kills × 100, consistent during play and on the high-score screen.

### Genes

Collect floating DNA pickups (max 3 at once). Fission clears your genes and gives you a fresh start.

| Symbol | Gene | Effect |
|--------|------|--------|
| H | Heat Shock Proteins | Halve drain during high temp |
| C | Cold Shock Proteins | Halve drain during low temp |
| F | Extra Flagellum | +40% speed, slight extra drain |
| M | Thick Membrane | Survive predator longer, −15% speed |
| T | Toxin Secretion | Larger bacteriocin range |

### Mechanics

- **NPC bacteria** — wander the world; each carries 1–2 genes. Ram them at speed to kill and release their genes.
- **Predator** (large red eukaryote) — chases when close; engulfs and lyses you unless you have Thick Membrane.
- **Fission** (F / DIVIDE button) — requires energy > 150. Splits you into two cells; your daughter inherits your genes and wanders freely. The membrane constricts and the two cells separate along the swimming axis. You continue with 80 energy and empty adaptation slots.
- **Bacteriocin** (B) — fires an expanding antimicrobial ring; kills nearby cells. 5-second cooldown, costs 30 energy. Toxin gene increases range.
- **Conjugation** (C) — extend a pilus to a nearby cell and steal one of its genes. Takes ~2 seconds; requires proximity.

---

## Controls

### Mobile
- **Swipe** anywhere on the left 2/3 of the screen to row — each stroke propels the cell in the swipe direction.
- **Divide / Burst / Conjugate** buttons on the right edge show energy requirements, cooldowns and availability.
- **Tumble** button on the left changes direction.
- **Pause** at the top-right freezes the world. Switching away from the tab also pauses it.

### Desktop
| Key | Action |
|-----|--------|
| W / ↑ | Thrust forward |
| S / ↓ | Reverse |
| A / ← | Rotate left |
| D / → | Rotate right |
| Space | Tumble |
| F | Fission |
| B | Bacteriocin |
| C | Conjugation |

---

## Visual design

Each cell type has a distinct full-colour ultrastructure drawn in real time as vector graphics (Phaser 3 Graphics API):

- **Player** — gold membrane, amber periplasm, orange nucleoid, bright inclusion granules
- **NPCs** — four jewel palettes: cyan/teal, rose/magenta, lime/green, violet/purple
- **Predator** — deep red with visible vacuoles, mitochondria, and nucleus/nucleolus
- **Flagella** — three fine sinusoidal strands that animate with movement speed

All cells render gram-negative ultrastructure: outer membrane, periplasmic space, inner membrane, cytoplasm, nucleoid, ribosomes (on capable screens), LPS surface fuzz.

---

## Running locally

The game uses native browser modules. Serve the repository over HTTP:

```
python3 -m http.server 8080
```

Then visit `http://localhost:8080`. Phaser 3 loads from CDN. Opening `index.html` directly is not supported; offline startup is not implemented.

---

## Tech stack

- [Phaser 3](https://phaser.io/) — game engine (CDN)
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
| `src/input/swim-input.mjs` | Swipe ownership, cancellation and event cleanup |
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
