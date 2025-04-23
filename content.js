// content.js
;(() => {
  // ── 0) INJECT ALL CSS ─────────────────────────────────────────────────────
  const css = document.createElement("style");
  css.textContent = `
    /* ===== Settings Modal ===== */
    #qs-settings-modal {
      position: fixed; top:0; left:0; width:100%; height:100%;
      display: flex; align-items:center; justify-content:center;
      background: rgba(0,0,0,0.6); z-index:100000;
      font-family: 'Press Start 2P', cursive, sans-serif;
    }
    #qs-settings-modal .qs-modal {
      display: flex; width:700px; height:400px;
      background: #c62828; border:8px solid #7f0000; border-radius:16px;
      overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.8);
    }
    #qs-settings-modal .qs-console {
      flex: 1;
      background: url(${chrome.runtime.getURL("icons/console.png")}) center/cover no-repeat;
    }
    #qs-settings-modal .qs-menu {
      flex: 1; background: #ffeb3b; padding: 20px; box-sizing: border-box;
      display: flex; flex-direction: column; justify-content: space-between;
    }
    #qs-settings-modal .qs-menu h2 {
      margin: 0 0 16px; font-size: 18px; text-align: center;
    }
    #qs-settings-modal .qs-menu ul {
      list-style: none; padding: 0; margin: 0; flex: 1;
    }
    #qs-settings-modal .qs-menu li {
      margin: 8px 0; padding-left: 20px; position: relative; cursor: pointer;
    }
    #qs-settings-modal .qs-menu li::before {
      content: '›'; position: absolute; left: 0; color: #333;
    }
    #qs-settings-modal .qs-menu li.selected {
      background: #f57f17;
    }
    #qs-settings-modal .qs-menu .custom-input {
      margin-left: 20px; width: 60px; font-size: 14px;
      padding: 4px; display: none;
    }
    #qs-settings-modal .qs-buttons {
      text-align: right;
    }
    #qs-settings-modal .qs-buttons button {
      background: #333; color: #ffeb3b; border: none;
      padding: 8px 16px; font-family: inherit; font-size: 14px;
      cursor: pointer; border-radius: 4px;
    }

    /* ===== Overlay ===== */
    #ayah-overlay {
      display: none; position: fixed; top: 0; left: 0;
      width: 100%; height: 100%; background: rgba(0,0,0,0.8);
      overflow-y: auto; padding: 20px; z-index: 999997; color: #222;
    }
    #ayah-overlay .content {
      max-width: 600px; margin: 60px auto;
      background: #fff; padding: 20px; border-radius: 8px;
    }
    #ayah-header { text-align: center; font-weight: bold; margin-bottom: 8px; }
    #ayah-header .surah { color: #f00; }
    #ayah-text {
      font-family: 'Scheherazade', serif; font-size: 1.4em;
      direction: rtl; text-align: right; background: #ffff99;
      padding: 8px; border-radius: 4px;
    }
    #ayah-trans { margin-top: 12px; font-style: italic; color: #333; }
    #ayah-audio { width: 100%; margin-top: 12px; }
    #ayah-close {
      margin-top: 16px; width: 100%; padding: 8px;
      background: #eee; border: none; cursor: pointer;
      border-radius: 4px; font-size: 16px;
    }

    /* ===== Retro TV & Grid ===== */
    #surah-tv-frame {
      position: relative; width: 220px; height: 200px;
      margin: 0 auto; padding: 16px;
      background: #3c2f2f; border-radius: 12px;
      box-shadow: inset 0 0 0 8px #221a1a, 0 4px 8px rgba(0,0,0,0.5);
    }
    #surah-tv-frame::before {
      content: '';
      position: absolute; top: 16px; left: 16px;
      width: calc(100% - 32px); height: calc(100% - 32px);
      background: #0f0f0f; border-radius: 6px;
      box-shadow: inset 0 0 12px rgba(0,0,0,0.8);
      z-index: 0;
    }
    #juz-grid {
      position: relative; z-index: 1; padding: 4px;
      display: grid !important;
      grid-template-columns: repeat(6,1fr) !important;
      grid-template-rows: repeat(5,1fr) !important;
      gap: 4px !important;
      width: calc(100% - 32px); height: calc(100% - 32px);
    }
    @keyframes pop { 0%,100%{transform:scale(1);}50%{transform:scale(1.2);} }
    .juz-btn {
      background: #111; color: #0f0; font-weight: bold;
      border: 2px solid #0f0; border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.6);
      transition: background 0.2s, color 0.2s;
    }
    .juz-btn:hover {
      background: #0f0; color: #000;
    }
    .juz-btn:active {
      animation: pop 0.3s ease-in-out;
    }
    .juz-btn.unlocked {
      background: #f00 !important; color: #000 !important;
      border-color: #f00 !important;
    }

    /* ===== Toggle Icon & Panel defaults ===== */
    /* created dynamically: default hidden via JS */
  `;
  document.head.appendChild(css);

  // ── 1) SETTINGS MODAL MARKUP ─────────────────────────────────────────────
  const modal = document.createElement("div");
  modal.id = "qs-settings-modal";
  modal.innerHTML = `
    <div class="qs-modal">
      <div class="qs-console"></div>
      <div class="qs-menu">
        <h2>Launch Quran Solver after:</h2>
        <ul>
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
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);

  // ── 2) SETTINGS LOGIC ─────────────────────────────────────────────────────
  let selectedMinutes = null;
  const items = modal.querySelectorAll("li");
  const customInput = modal.querySelector(".custom-input");

  items.forEach(li => {
    li.addEventListener("click", () => {
      items.forEach(x => x.classList.remove("selected"));
      li.classList.add("selected");
      if (li.dataset.minutes === "custom") {
        customInput.style.display = "inline-block";
        customInput.focus();
        selectedMinutes = null;
      } else {
        customInput.style.display = "none";
        selectedMinutes = parseInt(li.dataset.minutes, 10);
      }
    });
  });

  modal.querySelector("#qs-save").onclick = () => {
    if (selectedMinutes == null) {
      const v = parseInt(customInput.value, 10);
      if (v > 0) selectedMinutes = v;
      else return alert("Enter a valid number of minutes");
    }
    chrome.storage.local.set({ delayMinutes: selectedMinutes }, () => {
      modal.remove();
      initSolverUI();
      startSolverWatcher();
    });
  };

  chrome.storage.local.get("delayMinutes", ({ delayMinutes }) => {
    if (delayMinutes == null) {
      modal.style.display = "flex";
    } else {
      selectedMinutes = delayMinutes;
      modal.remove();
      initSolverUI();
      startSolverWatcher();
    }
  });

  // ── 3) PRELOAD QURAN DATA ─────────────────────────────────────────────────
  let chaptersList = [];
  fetch("https://api.quran.com/api/v4/chapters?language=en")
    .then(r => r.json()).then(j => chaptersList = j.chapters).catch(console.error);

  const juzMap = {};
  Array.from({ length: 30 }, (_, i) => i + 1).forEach(juz => {
    fetch(`https://api.alquran.cloud/v1/juz/${juz}/quran-uthmani`)
      .then(r => r.json())
      .then(data => {
        juzMap[juz] = data.data.ayahs.map(v => ({
          surah: v.surah.number,
          ayah: v.numberInSurah
        }));
      })
      .catch(() => { juzMap[juz] = []; });
  });

  // ── 4) INIT UI (ICON, PANEL, GRID, OVERLAY) ─────────────────────────────
  let unlocked = new Set();

  // Toggle Icon
  const icon = document.createElement("div");
  Object.assign(icon.style, {
    position: "fixed", top: "10px", right: "10px",
    width: "40px", height: "40px",
    background: `url(${chrome.runtime.getURL("icons/icon128.png")}) center/contain no-repeat`,
    cursor: "pointer", zIndex: 999999, display: "none"
  });
  document.body.appendChild(icon);
  chrome.storage.local.get(['iconLeft','iconTop'], d => {
    if (d.iconLeft && d.iconTop) {
      Object.assign(icon.style, { left: d.iconLeft, top: d.iconTop, right: "auto" });
    }
  });
  let iconDrag = false, ix = 0, iy = 0;
  icon.addEventListener("mousedown", e => {
    iconDrag = true;
    const r = icon.getBoundingClientRect();
    ix = e.clientX - r.left; iy = e.clientY - r.top;
    document.addEventListener("mousemove", moveIcon);
    document.addEventListener("mouseup", upIcon);
  });
  function moveIcon(e) {
    if (!iconDrag) return;
    icon.style.left = (e.clientX - ix) + "px";
    icon.style.top  = (e.clientY - iy) + "px";
    icon.style.right = "auto";
  }
  function upIcon() {
    iconDrag = false;
    document.removeEventListener("mousemove", moveIcon);
    document.removeEventListener("mouseup", upIcon);
    chrome.storage.local.set({ iconLeft: icon.style.left, iconTop: icon.style.top });
  }

  // Panel
  const panel = document.createElement("div");
  Object.assign(panel.style, {
    position: "fixed", top: "60px", right: "10px",
    width: "150px", height: "150px",
    background: "rgba(255,255,255,0.95)", padding: "4px",
    borderRadius: "6px", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
    display: "none", flexDirection: "column", zIndex: 999998
  });
  panel.style.display = "flex";
  document.body.appendChild(panel);
  icon.addEventListener("click", () => {
    panel.style.display = panel.style.display === "none" ? "flex" : "none";
  });
  chrome.storage.local.get(['panelLeft','panelTop'], d => {
    if (d.panelLeft && d.panelTop) {
      Object.assign(panel.style, { left: d.panelLeft, top: d.panelTop, right: "auto" });
    }
  });
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

  // Grid inside Retro-TV frame
  const grid = document.createElement("div");
  grid.id = "juz-grid";
  const frame = document.createElement("div");
  frame.id = "surah-tv-frame";
  frame.appendChild(grid);
  panel.appendChild(frame);

  // Overlay for verse
  const overlay = document.createElement("div");
  overlay.id = "ayah-overlay";
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

  // ── 5) SOLVER FUNCTIONS ──────────────────────────────────────────────────
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
    const chap = chaptersList.find(c => c.id === s) || {};
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
    icon.style.display = "block";
    panel.style.display = "flex";
    renderGrid();
    unlockAyah(Math.floor(Math.random() * 30) + 1);
  }

  function initSolverUI() {
    // ensure UI elements are in place but hidden
    icon.style.display = "none";
    panel.style.display = "none";
    overlay.style.display = "none";
  }

  // ── 6) WATCH “Accepted” + DELAY ─────────────────────────────────────────
  function startSolverWatcher() {
    let done = false;
    const obs = new MutationObserver(() => {
      if (done) return;
      const span = document.querySelector("span[data-cypress='judge-status-text']");
      if (span?.textContent.trim() === "Accepted") {
        done = true;
        obs.disconnect();
        if (selectedMinutes > 0) {
          setTimeout(triggerSolver, selectedMinutes * 60000);
        } else if (selectedMinutes < 1) {
          // never
        } else {
          triggerSolver();
        }
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });

    // immediate check if already “Accepted”
    if (document.body.innerText.includes("Accepted")) {
      if (selectedMinutes > 0) {
        setTimeout(triggerSolver, selectedMinutes * 60000);
      } else if (selectedMinutes < 1) {
        // never
      } else {
        triggerSolver();
      }
    }
  }

  // ── 7) STARTUP ───────────────────────────────────────────────────────────
  function init() {
    initSolverUI();
    // settings modal or start watcher happens in modal logic
  }

  init();

})();
