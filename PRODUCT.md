# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Nabil is directing the game. The wider target audience is not specified. Phones are the primary optimisation target, explicitly requested on 23 October 2026.

## Product Purpose

A browser learning game about bacterial lifestyles: obtaining energy, surviving a changing environment, acquiring useful traits and passing them to descendants. The primary loop is feed, adapt, reproduce. Reproduction is the main measure of success; an arbitrary colony win is not the learning objective. The approved visual development is a shallow 3D microscopy scene inspired by the dimensional quality of Phoenix Trader's town view.

## Capabilities and Constraints

Keep flat movement and a shared simulation clock. Swimming is constrained to the body axis with viscous damping and brief tumbles. Both cells retain traits after division. Conjugation copies from a living donor; transformation takes up loose DNA. Display trait benefits and costs in context. Use a fixed orthographic camera, rather than adding free 3D navigation. Existing scores are local to the browser. No build step or package installation is required to run the static site over HTTP.

Phaser owns gameplay and the clock. Three.js owns the main 3D world. Native DOM controls remain independent of camera zoom. Mobile rendering cost, battery use and small-screen readability are priorities. Browser viewport checks are not physical-phone benchmarks. The game is an explicit simplified educational model, not a scientifically validated simulator.

## Product Principles

- Prioritise phone play and clear touch targets.
- Keep learning intent visible and align rewards with reproduction and inheritance.
- Give simulation and presentation one shared clock.
- Keep rendering budgets, recovery and lifecycle ownership explicit.
