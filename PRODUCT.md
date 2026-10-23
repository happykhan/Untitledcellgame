# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Nabil is directing the game. The wider target audience is not specified. Phones are the primary optimisation target, explicitly requested on 23 October 2026.

## Product Purpose

A browser single-cell survival game: swim, feed, acquire up to three adaptations, avoid a predator and divide. The approved visual development is a shallow 3D microscopy scene inspired by the dimensional quality of Phoenix Trader's town view.

## Capabilities and Constraints

Preserve flat movement, collisions, gene effects, division, keyboard controls and touch controls. Use a fixed orthographic camera, rather than adding free 3D navigation. Existing scores are local to the browser. No build step or package installation is required to run the static site over HTTP.

Phaser owns gameplay and the clock. Three.js owns the main 3D world. Native DOM controls remain independent of camera zoom. Mobile rendering cost, battery use and small-screen readability are priorities. Browser viewport checks are not physical-phone benchmarks. Existing scientific-accuracy claims have not been validated.

## Product Principles

- Prioritise phone play and clear touch targets.
- Preserve gameplay while improving visual depth.
- Give simulation and presentation one shared clock.
- Keep rendering budgets, recovery and lifecycle ownership explicit.
