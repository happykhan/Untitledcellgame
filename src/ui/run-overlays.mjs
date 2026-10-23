function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

export function showInstructions({ isMobile, onStart }) {
  const div = document.createElement("div");
  div.id = "cell-intro";
  div.className = "cell-intro";
  div.setAttribute("role", "dialog");
  div.setAttribute("aria-modal", "true");
  div.setAttribute("aria-labelledby", "intro-title");
  div.innerHTML = `
      <div class="intro-content">
        <h1 id="intro-title">Survive</h1>
        <p class="intro-lead">One cell. A whole world to navigate.</p>
        <ol class="intro-steps">
          <li><strong>Feed</strong><span>Swim through orange nutrients to restore energy.</span></li>
          <li><strong>Adapt</strong><span>Collect DNA diamonds. Carry up to three adaptations.</span></li>
          <li><strong>Divide</strong><span>Build over 150 energy, then release a daughter carrying your adaptations.</span></li>
        </ol>
        <p class="intro-danger">Keep clear of the large red predator.</p>
        <p class="intro-controls">${isMobile ? "Hold and drag to steer. Release to stop. Use your other thumb for abilities." : "WASD / arrows move · drag to steer · Space tumble<br>F divide · B burst · C conjugate"}</p>
        <button class="intro-start">Start swimming</button>
      </div>`;

  document.body.appendChild(div);

  const dismiss = () => {
    if (!document.body.contains(div)) return;
    document.body.removeChild(div);
    onStart();
    document.removeEventListener("keydown", dismiss);
  };
  const focusTimer = setTimeout(() => {
    div.querySelector("button").addEventListener("click", dismiss);
    div.querySelector("button").focus();
    document.addEventListener("keydown", dismiss, { once: true });
  }, 300);
  return () => {
    clearTimeout(focusTimer);
    div.remove();
    document.removeEventListener("keydown", dismiss);
  };
}

export function showGameOver({ reason, elapsed, kills, score, scores, lastName, onPlayAgain }) {
  const top5 = [...scores].sort((a, b) => b.score - a.score).slice(0, 5);
  const lbRows = top5.length
    ? top5
        .map(
          (s, i) => `
          <div style="display:flex;justify-content:space-between;gap:16px;
            color:${i === 0 ? "#ffd060" : "#aaccbb"};font-size:13px;padding:3px 0;border-bottom:1px solid #1a1a2a">
            <span>${i + 1}. ${escapeHtml(s.name || "ANON")}</span>
            <span>${s.score}pts &nbsp; ${s.elapsed}s &nbsp; ${s.kills}k</span>
          </div>`,
        )
        .join("")
    : '<div style="color:#445566;font-size:12px;padding:6px 0">no scores yet</div>';

  const div = document.createElement("div");
  div.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:100%;" +
    "background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;" +
    "z-index:9999;font-family:monospace,Courier New;";

  div.innerHTML = `
      <div style="border:1.5px solid rgba(255,34,68,0.45);border-radius:10px;
        background:rgba(10,10,30,0.98);padding:28px 32px;max-width:360px;
        width:calc(100% - 48px);text-align:center;line-height:1.7;">
        <div style="font-size:24px;font-weight:bold;color:#ff2244;letter-spacing:2px;margin-bottom:4px">
          ${reason || "DEAD"}</div>
        <div style="font-size:13px;color:#aaccbb;margin-bottom:2px">${elapsed}s &nbsp;·&nbsp; ${kills} kills</div>
        <div style="font-size:26px;font-weight:bold;color:#ffd060;margin-bottom:18px">${score} pts</div>

        <input id="ucg-name" type="text" maxlength="16" placeholder="your name"
          value="${escapeHtml(lastName)}"
          style="width:100%;box-sizing:border-box;background:#0a0a20;
            border:1px solid rgba(255,208,96,0.35);border-radius:6px;
            color:#ffd060;font-family:monospace,Courier New;font-size:16px;
            padding:8px 12px;text-align:center;outline:none;margin-bottom:18px"/>

        <div style="font-size:10px;color:#556677;letter-spacing:2px;margin-bottom:8px">HIGH SCORES</div>
        <div style="margin-bottom:20px;padding:8px 12px;background:#05050f;border-radius:6px;text-align:left">
          ${lbRows}</div>

        <button id="ucg-submit" style="background:#ffd060;color:#07071a;border:none;border-radius:6px;
          font-family:monospace,Courier New;font-size:14px;font-weight:bold;
          padding:10px 32px;cursor:pointer;letter-spacing:1px;">PLAY AGAIN</button>
      </div>`;

  document.body.appendChild(div);

  let submitted = false;
  const submit = () => {
    const name = (document.getElementById("ucg-name")?.value || "").trim() || "ANON";
    if (submitted) return;
    submitted = true;
    div.remove();
    onPlayAgain(name);
  };

  const focusTimer = setTimeout(() => {
    document.getElementById("ucg-submit")?.addEventListener("click", submit);
    document.getElementById("ucg-name")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });
    document.getElementById("ucg-name")?.focus();
  }, 100);
  return () => {
    clearTimeout(focusTimer);
    div.remove();
  };
}
