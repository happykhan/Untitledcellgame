// Native controls stay sharp and retain their touch size at every camera zoom.
class CellHUD {
  static escape(value) {
    return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  constructor(scene) {
    this.scene = scene;
    const icons = {
      divide: '<path d="M9 5a5 5 0 0 0-5 5v4a5 5 0 0 0 5 5m6-14a5 5 0 0 1 5 5v4a5 5 0 0 1-5 5M12 3v3m0 3v3m0 3v3m0 3v0"/>',
      burst: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
      gene: '<path d="M6 3c0 8 12 10 12 18M18 3c0 8-12 10-12 18M7 6h10M9 10h6M9 14h6M7 18h10"/>',
      tumble: '<path d="M5 9a8 8 0 1 1 0 7M5 3v6h6"/>',
      pause: '<path d="M9 5v14M15 5v14"/>',
    };
    const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
    const action = (name, label, key, detail) => `<button class="action action--${name}" data-action="${name}" aria-label="${label} (${key})">${icon(name)}<span><strong>${label}</strong><small>${detail}</small></span><kbd>${key}</kbd></button>`;
    this.root = document.createElement('div');
    this.root.className = 'cell-hud';
    this.root.innerHTML = `
      <div class="hud-top">
        <div class="energy-panel">
          <div class="energy-label"><span>Energy</span><strong data-energy></strong></div>
          <div class="energy-track" role="progressbar" aria-label="Energy" aria-valuemin="0" aria-valuemax="200"><div data-energy-fill></div><i title="Division threshold: over 150 energy"></i></div>
          <span class="energy-caption" data-energy-caption>Feed to divide</span>
        </div>
        <div class="run-info"><span><strong data-score>0</strong> pts</span><span data-temperature>37°C</span><button class="pause-button" data-action="pause" aria-label="Pause game">${icon('pause')}</button></div>
      </div>
      <div class="gene-panel"><span class="hud-label">Adaptations</span><div class="gene-slots">${[0,1,2].map(() => '<div class="gene-slot"><span>Empty</span></div>').join('')}</div><span class="lineage" data-lineage>First generation</span></div>
      <div class="hud-message" role="status" aria-live="polite"></div>
      <div class="movement-panel">${action('tumble', 'Tumble', 'Space', 'Change direction')}<span class="movement-hint">W / ↑ swim · A / D steer</span></div>
      <div class="actions">
        ${action('gene', 'Conjugate', 'C', 'Find a nearby cell')}
        ${action('burst', 'Burst', 'B', '30 energy')}
        ${action('divide', 'Divide', 'F', 'Over 150 energy')}
      </div>
      <div class="pause-banner" hidden><h1>Adrift</h1><p>Your microscopic world is paused.</p><button data-action="resume">Resume swimming</button></div>`;
    document.body.appendChild(this.root);
    this.energy = this.root.querySelector('[data-energy]');
    this.fill = this.root.querySelector('[data-energy-fill]');
    this.track = this.root.querySelector('.energy-track');
    this.caption = this.root.querySelector('[data-energy-caption]');
    this.score = this.root.querySelector('[data-score]');
    this.temperature = this.root.querySelector('[data-temperature]');
    this.lineage = this.root.querySelector('[data-lineage]');
    this.slots = [...this.root.querySelectorAll('.gene-slot')];
    this.buttons = Object.fromEntries([...this.root.querySelectorAll('[data-action]')].map(button => [button.dataset.action, button]));
    this.message = this.root.querySelector('.hud-message');
    this.root.addEventListener('click', event => {
      const button = event.target.closest('[data-action]');
      if (!button || button.disabled) return;
      const action = button.dataset.action;
      if (action === 'pause' || action === 'resume') { this.togglePause(); return; }
      if (!scene.alive || scene.dying || scene.fissioning || scene.showingInstructions || this.paused) return;
      if (action === 'divide') scene._triggerFission();
      if (action === 'burst') scene._fireBacteriocin();
      if (action === 'gene') scene._startConjugation();
      if (action === 'tumble' && !scene.tumbling) {
        scene.tumbling = true;
        scene.tumbleTimer = 400;
        scene.tumbleAngle = (Math.random() < 0.5 ? -1 : 1) * (Math.PI * 0.5 + Math.random() * Math.PI);
        scene.player.body.setAcceleration(0, 0);
      }
      button.blur();
    });
    this.onVisibility = () => {
      if (document.hidden && scene.alive && !scene.showingInstructions && !this.paused) this.togglePause();
    };
    document.addEventListener('visibilitychange', this.onVisibility);
    this.updateGenes();
  }

  togglePause() {
    if (!this.scene.alive || this.scene.dying || this.scene.showingInstructions) return;
    this.paused = !this.paused;
    this.root.querySelector('.pause-banner').hidden = !this.paused;
    this.buttons.pause.setAttribute('aria-label', this.paused ? 'Resume game' : 'Pause game');
    this.scene.swipe.active = false;
    if (this.paused) {
      this.pauseTime = performance.now();
      this.scene.scene.pause();
      this.buttons.resume.focus();
    } else {
      this.scene.startTime += performance.now() - this.pauseTime;
      this.scene.scene.resume();
      this.buttons.pause.focus();
    }
  }

  update(time) {
    if (time < (this.nextUpdate || 0)) return;
    this.nextUpdate = time + 100;
    const s = this.scene;
    const energy = Math.max(0, Math.floor(s.energy));
    this.energy.textContent = `${energy} / 200`;
    this.fill.style.width = `${Math.min(100, energy / 2)}%`;
    this.track.setAttribute('aria-valuenow', energy);
    this.root.dataset.energy = energy < 30 ? 'low' : energy > 150 ? 'ready' : 'normal';
    this.caption.textContent = s.fissioning ? 'Membrane separating…' : s.energy > 150 ? 'Ready to divide' : 'Feed to divide · over 150';
    this.score.textContent = Math.floor((time - s.startTime) / 1000) * 10 + s.killCount * 100;
    this.temperature.textContent = `${Math.round(s.temp)}°C · ${s.temp > 42 ? 'Heat stress' : s.temp < 30 ? 'Cold stress' : 'Optimal'}`;
    this.temperature.dataset.stress = s.temp > 42 ? 'hot' : s.temp < 30 ? 'cold' : 'none';
    this.lineage.textContent = s.divisionCount ? `${s.divisionCount} division${s.divisionCount === 1 ? '' : 's'} · ${s.daughters.filter(d => d.active).length} daughter${s.daughters.filter(d => d.active).length === 1 ? '' : 's'}` : 'First generation';
    const near = [...s.daughters, ...s.npcCells].some(c => c.active && c.genes?.size && Phaser.Math.Distance.Between(s.player.x, s.player.y, c.x, c.y) < 140);
    this.buttons.divide.disabled = s.energy <= 150 || s.fissioning;
    this.buttons.divide.querySelector('small').textContent = s.fissioning ? 'Dividing…' : s.energy > 150 ? 'Ready' : 'Over 150 energy';
    this.buttons.burst.disabled = s.bacterioTimer > 0 || energy < 30 || s.fissioning;
    this.buttons.burst.querySelector('small').textContent = s.bacterioTimer > 0 ? `${Math.ceil(s.bacterioTimer / 1000)}s cooldown` : '30 energy';
    this.buttons.gene.disabled = !near || s.activeGenes.size >= 3 || s.fissioning || !!s.conjTarget;
    this.buttons.gene.querySelector('small').textContent = s.conjTarget ? 'Transferring…' : s.activeGenes.size >= 3 ? 'All slots filled' : near ? 'Cell in reach' : 'Find a nearby cell';
    if (this.messageUntil && time > this.messageUntil) { this.message.textContent = ''; this.messageUntil = 0; }
    this.updateGenes();
  }

  notify(text) {
    this.message.textContent = text;
    this.messageUntil = this.scene.time.now + 2600;
  }

  updateGenes() {
    const keys = [...(this.scene.activeGenes || [])];
    const signature = keys.join(',');
    if (this.geneSignature === signature) return;
    this.geneSignature = signature;
    this.slots.forEach((slot, i) => {
      const gene = GENES[keys[i]];
      slot.classList.toggle('occupied', !!gene);
      slot.style.setProperty('--gene-colour', gene ? '#' + gene.color.toString(16).padStart(6, '0') : '#80938d');
      slot.textContent = gene ? `${gene.symbol} · ${gene.desc}` : 'Empty';
      slot.title = gene ? gene.desc : 'Collect a floating DNA pickup';
    });
  }

  destroy() {
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.root.remove();
  }
}
