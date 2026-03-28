# Untitled Cell Game

A scientifically-themed single-cell survival game built with Phaser 3.

## How to run

**Option 1 — Just open the file:**
```
open index.html
```
(Works in most browsers directly from the filesystem.)

**Option 2 — Local server (recommended, avoids any CORS quirks):**
```
python -m http.server 8080
```
Then visit `http://localhost:8080` in your browser.

No build step, no npm, no dependencies to install. Phaser 3 loads from CDN on first load, then the game runs fully offline.

---

## Controls

### Desktop
| Key | Action |
|-----|--------|
| W / ↑ | Thrust forward |
| S / ↓ | Reverse thrust |
| A / ← | Rotate left |
| D / → | Rotate right |
| Space | Tumble (random direction change) |
| F | Cell fission (requires energy > 150%) |

### Mobile
- On-screen buttons for movement and tumble
- Double-tap to trigger fission (when energy is high enough)

---

## Gameplay

You are a single prokaryotic cell trying to survive as long as possible.

- **Energy bar** (top left): drains over time. Eat orange food particles to replenish.
- **Temperature gauge** (top right): cycles between optimal (37°C), heat stress (55–70°C) and cold stress (10–20°C). Non-optimal temperatures increase energy drain.
- **Genetic elements** (bottom slots): collect floating DNA pickups for permanent upgrades:
  - **H** — Heat Shock Proteins: reduce drain during high temp
  - **C** — Cold Shock Proteins: reduce drain during low temp
  - **F** — Extra Flagellum: +40% speed, slight extra drain
  - **M** — Thick Membrane: resist predator engulfment, -15% speed
- **Predator** (large red cell): roams the world; chases you when nearby. Avoid it or use Thick Membrane to buy escape time.
- **Fission**: when energy exceeds 150%, press F to split. Your daughter cell inherits your genes and wanders autonomously. You restart clean with 80% energy — useful for shedding unwanted genes.

---

## Tech stack
- [Phaser 3](https://phaser.io/) (CDN)
- Single `index.html` + `game.js`, no build step
- Mobile-first with touch controls
