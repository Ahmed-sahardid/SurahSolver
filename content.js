// content.js
;(() => {
  // ── 0) INJECT ALL CSS ─────────────────────────────────────────────────────
  const css = document.createElement("style");
  css.textContent = `
    /* SETTINGS MODAL */
    #qs-settings-modal {
      position: fixed; top:0; left:0; width:100%; height:100%;
      display:flex; align-items:center; justify-content:center;
      background:rgba(0,0,0,0.6); z-index:100000;
      font-family:'Press Start 2P',monospace;
    }
    #qs-settings-modal .qs-modal {
      display:flex; width:700px; height:400px;
      background:#c62828; border:8px solid #7f0000; border-radius:16px;
      overflow:hidden; box-shadow:0 0 20px rgba(0,0,0,0.8);
    }
    #qs-settings-modal .qs-console {
      flex:1; background:#222;
      display:flex; align-items:center; justify-content:center;
      color:#ffeb3b; font-size:48px;
    }
    #qs-settings-modal .qs-console::after { content:"Q"; }
    #qs-settings-modal .qs-menu {
      flex:1; background:#ffeb3b; padding:20px;
      box-sizing:border-box; display:flex;
      flex-direction:column; justify-content:space-between;
    }
    #qs-settings-modal h2 {
      margin:0 0 16px; font-size:18px; text-align:center;
    }
    #qs-settings-modal ul {
      list-style:none; padding:0; margin:0; flex:1;
    }
    #qs-settings-modal li {
      margin:8px 0; padding-left:20px;
      position:relative; cursor:pointer;
    }
    #qs-settings-modal li::before {
      content:'›'; position:absolute; left:0; color:#333;
    }
    #qs-settings-modal li.selected { background:#f57f17; }
    #qs-settings-modal .custom-input {
      margin-left:20px; width:60px; font-size:14px;
      padding:4px; display:none;
    }
    #qs-settings-modal .qs-buttons {
      text-align:right;
    }
    #qs-settings-modal button {
      background:#333; color:#ffeb3b; border:none;
      padding:8px 16px; font-size:14px; cursor:pointer;
      border-radius:4px; margin-left:8px;
    }

    /* OVERLAY */
    #ayah-overlay {
      display:none; position:fixed; top:0; left:0;
      width:100%; height:100%; background:rgba(0,0,0,0.8);
      overflow-y:auto; padding:20px; z-index:999997; color:#222;
    }
    #ayah-overlay .content {
      max-width:600px; margin:60px auto;
      background:#fff; padding:20px; border-radius:8px;
    }
    #ayah-header { text-align:center; font-weight:bold; margin-bottom:8px; }
    #ayah-header .surah { color:#f00; }
    #ayah-text {
      font-family:'Scheherazade',serif; font-size:1.4em;
      direction:rtl; text-align:right; background:#ffff99;
      padding:8px; border-radius:4px;
    }
    #ayah-trans { margin-top:12px; font-style:italic; color:#333; }
    #ayah-audio { width:100%; margin-top:12px; }
    #ayah-close {
      margin-top:16px; width:100%; padding:8px;
      background:#eee; border:none; cursor:pointer;
      border-radius:4px; font-size:16px;
    }

    /* RETRO TV & GRID */
    #surah-tv-frame {
      position:relative; width:220px; height:200px;
      margin:0 auto; padding:16px;
      background:#3c2f2f; border-radius:12px;
      box-shadow:inset 0 0 0 8px #221a1a,0 4px 8px rgba(0,0,0,0.5);
    }
    #surah-tv-frame::before {
      content:''; position:absolute; top:16px; left:16px;
      width:calc(100% - 32px); height:calc(100% - 32px);
      background:#0f0f0f; border-radius:6px;
      box-shadow:inset 0 0 12px rgba(0,0,0,0.8); z-index:0;
    }
    #juz-grid {
      position:relative; z-index:1; padding:4px;
      display:grid !important;
      grid-template-columns:repeat(6,1fr)!important;
      grid-template-rows:repeat(5,1fr)!important;
      gap:4px!important;
      width:calc(100% - 32px); height:calc(100% - 32px);
    }
    @keyframes pop {0%,100%{transform:scale(1);}50%{transform:scale(1.2);} }
    .juz-btn {
      background:#111; color:#0f0; font-weight:bold;
      border:2px solid #0f0; border-radius:4px;
      box-shadow:0 2px 4px rgba(0,0,0,0.6);
      transition:background .2s,color .2s;
    }
    .juz-btn:hover { background:#0f0; color:#000; }
    .juz-btn:active { animation:pop .3s ease-in-out; }
    .juz-btn.unlocked {
      background:#f00!important; color:#000!important;
      border-color:#f00!important;
    }
  `;
  document.head.appendChild(css);

  // ── 1) SETTINGS MODAL ─────────────────────────────────────────────────────
  const modal = document.createElement("div");
  modal.id = "qs-settings-modal";
  modal.innerHTML = `
    <div class="qs-modal">
      <div class="qs-console"></div>
      <div class="qs-menu">
        <h2>Show you an Ayah after:</h2>
        <ul>
          <li data-seconds="3">3 Seconds</li>
          <li data-minutes="0">Never</li>
          <li data-minutes="5">5 Minutes</li>
          <li data-minutes="10">10 Minutes</li>
          <li data-minutes="15">15 Minutes</li>
          <li data-minutes="custom">Custom…
            <input type="number" class="custom-input" min="1" placeholder="min">
          </li>
        </ul>
        <div class="qs-buttons">
          <button id="qs-save">Confirm</button>
          <button id="qs-reset">Reset</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);

  // ── 2) SETTINGS LOGIC ─────────────────────────────────────────────────────
  let delayMs = null;
  const items = modal.querySelectorAll("li");
  const customInput = modal.querySelector(".custom-input");

  items.forEach(li => {
    li.addEventListener("click", () => {
      items.forEach(x => x.classList.remove("selected"));
      li.classList.add("selected");
      if (li.dataset.seconds) {
        delayMs = parseInt(li.dataset.seconds, 10) * 1000;
        customInput.style.display = "none";
      } else if (li.dataset.minutes === "custom") {
        delayMs = null;
        customInput.style.display = "inline-block";
        customInput.focus();
      } else {
        delayMs = parseInt(li.dataset.minutes, 10) * 60000;
        customInput.style.display = "none";
      }
    });
  });

  modal.querySelector("#qs-save").onclick = () => {
    if (delayMs === null) {
      const v = parseInt(customInput.value, 10);
      if (v > 0) delayMs = v * 60000;
      else return alert("Enter a valid number");
    }
    chrome.storage.local.set({ delayMs }, () => {
      modal.remove();
      initUI();
      setTimeout(triggerSolver, delayMs);
    });
  };

  modal.querySelector("#qs-reset").onclick = () => {
    chrome.storage.local.remove("delayMs", () => {
      delayMs = null;
      items.forEach(x => x.classList.remove("selected"));
      customInput.style.display = "none";
      customInput.value = "";
      modal.style.display = "flex";
    });
  };

  // block until Confirm
  modal.style.display = "flex";

  // ── 3) PRELOAD QURAN DATA ─────────────────────────────────────────────────
  let chapters = [];
  fetch("https://api.quran.com/api/v4/chapters?language=en")
    .then(r => r.json()).then(j => chapters = j.chapters)
    .catch(console.error);

  const juzMap = {};
  Array.from({ length: 30 }, (_, i) => i + 1).forEach(juz => {
    fetch(`https://api.alquran.cloud/v1/juz/${juz}/quran-uthmani`)
      .then(r => r.json())
      .then(d => juzMap[juz] = d.data.ayahs.map(v => ({
        surah: v.surah.number,
        ayah: v.numberInSurah
      })))
      .catch(() => juzMap[juz] = []);
  });

  // ── 4) BUILD SOLVER UI ────────────────────────────────────────────────────
  let unlocked = new Set();
  const panel = document.createElement("div");
  Object.assign(panel.style, {
    position: "fixed", top: "60px", right: "10px",
    width: "150px", height: "150px",
    background: "rgba(255,255,255,0.95)", padding: "4px",
    borderRadius: "6px", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
    display: "none", flexDirection: "column", zIndex: 999998
  });
  document.body.appendChild(panel);

  // draggable panel
  let panelDrag = false, px = 0, py = 0;
  panel.addEventListener("mousedown", e => {
    panelDrag = true;
    const r = panel.getBoundingClientRect();
    px = e.clientX - r.left; py = e.clientY - r.top;
    document.addEventListener("mousemove", movePanel);
    document.addEventListener("mouseup", upPanel);
  });
  function movePanel(e) {
    if (!panelDrag) return;
    panel.style.left = (e.clientX - px) + "px";
    panel.style.top  = (e.clientY - py) + "px";
    panel.style.right = "auto";
  }
  function upPanel() {
    panelDrag = false;
    document.removeEventListener("mousemove", movePanel);
    document.removeEventListener("mouseup", upPanel);
    chrome.storage.local.set({ panelLeft: panel.style.left, panelTop: panel.style.top });
  }
  chrome.storage.local.get(['panelLeft','panelTop'], d => {
    if (d.panelLeft && d.panelTop) Object.assign(panel.style, {
      left: d.panelLeft, top: d.panelTop, right: "auto"
    });
  });

  const grid = document.createElement("div"); grid.id = "juz-grid";
  const frame = document.createElement("div"); frame.id = "surah-tv-frame";
  frame.appendChild(grid); panel.appendChild(frame);

  const overlay = document.createElement("div"); overlay.id = "ayah-overlay";
  overlay.innerHTML = `
    <div class="content">
      <div id="ayah-header"></div>
      <div id="ayah-text"></div>
      <div id="ayah-trans"></div>
      <audio id="ayah-audio" controls></audio>
      <button id="ayah-close">Close</button>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector("#ayah-close").onclick = () => overlay.style.display = "none";

  function renderGrid() {
    grid.innerHTML = "";
    for (let j = 1; j <= 30; j++) {
      const b = document.createElement("button");
      b.textContent = j;
      b.className = "juz-btn" + (unlocked.has(j) ? " unlocked" : "");
      b.onclick = () => unlockAyah(j);
      grid.appendChild(b);
    }
  }

  function unlockAyah(j) {
    const list = juzMap[j] || [];
    if (!list.length) return;
    const { surah: s, ayah: a } = list[Math.floor(Math.random() * list.length)];
    const chap = chapters.find(c => c.id === s) || {};
    fetch(`https://api.alquran.cloud/v1/ayah/${s}:${a}/editions/quran-uthmani,ar.alafasy,en.asad`)
      .then(r => r.json())
      .then(js => {
        const [ar, au, tr] = js.data;
        document.getElementById("ayah-header").innerHTML =
          `Juz ${j} — <span class="surah">${chap.name_arabic} / ${chap.name_complex}</span> — Ayah ${a}`;
        document.getElementById("ayah-text").textContent = ar.text;
        document.getElementById("ayah-trans").textContent = tr.text;
        document.getElementById("ayah-audio").src = au.audio;
        overlay.style.display = "block";
        if (!unlocked.has(j)) {
          unlocked.add(j);
          renderGrid();
        }
      })
      .catch(console.error);
  }

  function triggerSolver() {
    panel.style.display = "flex";
    renderGrid();
    unlockAyah(Math.floor(Math.random() * 30) + 1);
  }

  function initUI() {
    panel.style.display = "none";
    overlay.style.display = "none";
  }

  // ── 5) INITIALIZE ─────────────────────────────────────────────────────────
  initUI();
})();
