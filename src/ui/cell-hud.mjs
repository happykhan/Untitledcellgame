// Native controls stay sharp and retain their touch size at every camera zoom.
export default class CellHUD {
  constructor({ onDivide, onBurst, onConjugate, onTumble, onTogglePause }) {
    const icons = {
      divide:
        '<path d="M9 5a5 5 0 0 0-5 5v4a5 5 0 0 0 5 5m6-14a5 5 0 0 1 5 5v4a5 5 0 0 1-5 5M12 3v3m0 3v3m0 3v3m0 3v0"/>',
      burst:
        '<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
      gene: '<path d="M6 3c0 8 12 10 12 18M18 3c0 8-12 10-12 18M7 6h10M9 10h6M9 14h6M7 18h10"/>',
      tumble: '<path d="M5 9a8 8 0 1 1 0 7M5 3v6h6"/>',
      pause: '<path d="M9 5v14M15 5v14"/>',
    };
    const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
    const action = (name, label, key, detail) =>
      `<button class="action action--${name}" data-action="${name}" aria-label="${label} (${key})">${icon(name)}<span><strong>${label}</strong><small>${detail}</small></span><kbd>${key}</kbd></button>`;
    this.root = document.createElement("div");
    this.root.className = "cell-hud";
    this.root.innerHTML = `
      <div class="hud-top">
        <div class="energy-panel">
          <div class="energy-label"><span>Energy</span><strong data-energy></strong></div>
          <div class="energy-track" role="progressbar" aria-label="Energy" aria-valuemin="0" aria-valuemax="200"><div data-energy-fill></div><i title="Division threshold: over 150 energy"></i></div>
          <span class="energy-caption" data-energy-caption>Feed to divide</span>
        </div>
        <div class="run-info"><span><strong data-score>0</strong> pts</span><span data-temperature>37°C</span><button class="pause-button" data-action="pause" aria-label="Pause game">${icon("pause")}</button></div>
      </div>
      <div class="life-goal"><strong>Grow your lineage</strong><span data-lineage>0 descendants produced</span><small data-goal>Feed to build energy for division</small></div>
      <div class="gene-panel"><span class="hud-label">Adaptations</span><div class="gene-slots">${[0, 1, 2].map(() => '<div class="gene-slot"><span>Empty</span></div>').join("")}</div></div>
      <div class="hud-message" role="status" aria-live="polite"></div>
      <div class="movement-panel"><span class="movement-hint">WASD / arrows to move · drag to steer</span></div>
      <div class="actions">
        ${action("tumble", "Tumble", "Space", "Change direction")}
        ${action("gene", "Conjugate", "C", "Find a nearby cell")}
        ${action("burst", "Burst", "B", "30 energy")}
        ${action("divide", "Divide", "F", "Over 150 energy")}
      </div>
      <div class="pause-banner" hidden><h1>Adrift</h1><p>Your microscopic world is paused.</p><button data-action="resume">Resume swimming</button></div>`;
    document.body.appendChild(this.root);
    this.energy = this.root.querySelector("[data-energy]");
    this.fill = this.root.querySelector("[data-energy-fill]");
    this.track = this.root.querySelector(".energy-track");
    this.caption = this.root.querySelector("[data-energy-caption]");
    this.score = this.root.querySelector("[data-score]");
    this.temperature = this.root.querySelector("[data-temperature]");
    this.lineage = this.root.querySelector("[data-lineage]");
    this.goal = this.root.querySelector("[data-goal]");
    this.slots = [...this.root.querySelectorAll(".gene-slot")];
    this.buttons = Object.fromEntries(
      [...this.root.querySelectorAll("[data-action]")].map((button) => [button.dataset.action, button]),
    );
    this.message = this.root.querySelector(".hud-message");
    const actions = {
      divide: onDivide,
      burst: onBurst,
      gene: onConjugate,
      tumble: onTumble,
      pause: onTogglePause,
      resume: onTogglePause,
    };
    this.root.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button || button.disabled) return;
      actions[button.dataset.action]();
      if (!["pause", "resume"].includes(button.dataset.action)) button.blur();
    });
  }

  setPaused(paused) {
    this.root.querySelector(".pause-banner").hidden = !paused;
    this.buttons.pause.setAttribute("aria-label", paused ? "Resume game" : "Pause game");
    if (paused) this.buttons.resume.focus();
    else this.buttons.pause.focus();
  }

  update(state, time) {
    this.energy.textContent = `${state.energy} / ${state.maxEnergy}`;
    this.fill.style.width = `${Math.min(100, (state.energy / state.maxEnergy) * 100)}%`;
    this.track.setAttribute("aria-valuenow", state.energy);
    this.track.setAttribute("aria-valuemax", state.maxEnergy);
    this.track.querySelector("i").style.left = `${state.divisionPercent}%`;
    this.root.dataset.energy = state.energyState;
    this.caption.textContent = state.energyCaption;
    this.score.textContent = state.score;
    this.temperature.textContent = state.temperature;
    this.temperature.dataset.stress = state.temperatureStress;
    this.lineage.textContent = state.lineage;
    this.goal.textContent = state.goal;
    for (const [name, action] of Object.entries(state.actions)) {
      this.buttons[name].disabled = !action.enabled;
      this.buttons[name].querySelector("small").textContent = action.detail;
    }
    if (this.messageUntil && time > this.messageUntil) {
      this.message.textContent = "";
      this.messageUntil = 0;
    }
    this.updateGenes(state.genes);
  }

  notify(text, time) {
    this.message.textContent = text;
    this.messageUntil = time + 5200;
  }

  updateGenes(genes) {
    const signature = genes.map((gene) => gene.key).join(",");
    if (this.geneSignature === signature) return;
    this.geneSignature = signature;
    this.slots.forEach((slot, i) => {
      const gene = genes[i];
      slot.classList.toggle("occupied", !!gene);
      slot.style.setProperty(
        "--gene-colour",
        gene ? "#" + gene.color.toString(16).padStart(6, "0") : "#80938d",
      );
      slot.textContent = gene ? `${gene.symbol} · ${gene.desc} · ${gene.short}` : "Empty";
      slot.title = gene ? gene.effect : "Collect a floating DNA pickup";
    });
  }

  destroy() {
    this.root.remove();
  }
}
