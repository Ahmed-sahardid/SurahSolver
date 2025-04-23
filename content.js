// content.js
;(() => {
  // ── 0) Inject CSS (modal + overlay + retro-TV + buttons) ─────────────────
  const css = document.createElement("style");
  css.textContent = `
    /* Settings Modal */
    #qs-settings-modal .qs-modal-backdrop {
      position: fixed; top:0; left:0; width:100%; height:100%;
      background: rgba(0,0,0,0.6); z-index:100000;
    }
    #qs-settings-modal .qs-modal {
      position: fixed; top:50%; left:50%; transform: translate(-50%,-50%);
      background: #fff; padding: 20px; border-radius: 8px; z-index:100001;
      box-shadow: 0 2px 10px rgba(0,0,0,0.5); max-width: 300px;
      font-family: sans-serif;
    }
    #qs-settings-modal label { display: block; margin: 8px 0; }
    #qs-settings-modal .qs-buttons { text-align: right; margin-top: 12px; }

    /* Overlay backdrop */
    #ayah-overlay {
      display: none; position: fixed; top:0; left:0;
      width:100%; height:100%; background:rgba(0,0,0,0.8);
      overflow-y:auto; padding:20px; z-index:999997; color:#222;
    }
    /* Overlay content box */
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

    /* Retro TV frame */
    #surah-tv-frame {
      position: relative;
      width: 220px; height: 200px;
      margin: 0 auto; padding:16px;
      background: #3c2f2f; border-radius:12px;
      box-shadow: inset 0 0 0 8px #221a1a, 0 4px 8px rgba(0,0,0,0.5);
    }
    #surah-tv-frame::before {
      content:''; position:absolute; top:16px; left:16px;
      width:calc(100%-32px); height:calc(100%-32px);
      background:#0f0f0f; border-radius:6px;
      box-shadow: inset 0 0 12px rgba(0,0,0,0.8); z-index:0;
    }
    #juz-grid {
      position:relative; z-index:1; padding:4px;
      display:grid !important;
      grid-template-columns: repeat(6,1fr) !important;
      grid-template-rows:    repeat(5,1fr) !important;
      gap:4px !important;
      width:calc(100%-32px); height:calc(100%-32px);
    }

    /* Animated buttons */
    @keyframes pop { 0%,100%{transform:scale(1);}50%{transform:scale(1.2);} }
    .juz-btn {
      background:#111; color:#0f0; font-weight:bold;
      border:2px solid #0f0; border-radius:4px;
      box-shadow:0 2px 4px rgba(0,0,0,0.6);
      transition:background 0.2s,color 0.2s;
    }
    .juz-btn:hover { background:#0f0; color:#000; }
    .juz-btn:active { animation:pop 0.3s ease-in-out; }
    .juz-btn.unlocked {
      background:#f00 !important; color:#000 !important;
      border-color:#f00 !important;
    }
  `;
  document.head.appendChild(css);

  // ── A) SETTINGS MODAL ─────────────────────────────────────────────────────
  const modal = document.createElement("div");
  modal.id = "qs-settings-modal";
  modal.innerHTML = `
    <div class="qs-modal-backdrop"></div>
    <div class="qs-modal">
      <h2>Quran Solver Settings</h2>
      <p>When should Quran Solver run after you solve a problem?</p>
      <label><input type="radio" name="qs-delay" value="0"> Never</label>
      <label><input type="radio" name="qs-delay" value="5"> 5 minutes</label>
      <label><input type="radio" name="qs-delay" value="10"> 10 minutes</label>
      <label><input type="radio" name="qs-delay" value="15"> 15 minutes</label>
      <label>
        <input type="radio" name="qs-delay" value="custom"> Custom:
        <input type="number" id="qs-custom-delay" min="1" style="width:4em" disabled> min
      </label>
      <div class="qs-buttons">
        <button id="qs-save">Save</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  function showModal() {
    modal.style.display = "block";
    const radios = modal.querySelectorAll("input[name=qs-delay]");
    const customInput = modal.querySelector("#qs-custom-delay");
    radios.forEach(r => {
      r.addEventListener("change", () => {
        customInput.disabled = r.value !== "custom";
      });
    });
    modal.querySelector("#qs-save").onclick = () => {
      const sel = modal.querySelector("input[name=qs-delay]:checked").value;
      let minutes = sel === "custom"
        ? parseInt(customInput.value) || 0
        : parseInt(sel, 10);
      chrome.storage.local.set({ delayMinutes: minutes }, () => {
        modal.style.display = "none";
        startWatcher();
      });
    };
  }

  // ── B) FETCH STATIC DATA ─────────────────────────────────────────────────
  let chapters = [];
  fetch("https://api.quran.com/api/v4/chapters?language=en")
    .then(r => r.json()).then(j => (chapters = j.chapters))
    .catch(console.error);

  const juzMap = {};
  Array.from({ length: 30 }, (_, i) => i+1).forEach(j => {
    fetch(`https://api.alquran.cloud/v1/juz/${j}/quran-uthmani`)
      .then(r => r.json())
      .then(data => {
        juzMap[j] = data.data.ayahs.map(v => ({
          surah: v.surah.number, ayah: v.numberInSurah
        }));
      })
      .catch(() => { juzMap[j] = []; });
  });

  // ── C) BUILD UI COMPONENTS ────────────────────────────────────────────────
  // 1) Toggle icon
  const icon = document.createElement("div");
  Object.assign(icon.style, {
    position:"fixed", top:"10px", right:"10px",
    width:"40px", height:"40px",
    background:`url(${chrome.runtime.getURL("icons/icon128.png")}) center/contain no-repeat`,
    cursor:"pointer", zIndex:999999, display:"none"
  });
  document.body.appendChild(icon);
  chrome.storage.local.get(['iconLeft','iconTop'], d => {
    if (d.iconLeft && d.iconTop) Object.assign(icon.style, { left:d.iconLeft, top:d.iconTop, right:"auto" });
  });
  let iconDrag=false, ix=0, iy=0;
  icon.addEventListener("mousedown", e => {
    iconDrag = true;
    const r = icon.getBoundingClientRect();
    ix = e.clientX - r.left; iy = e.clientY - r.top;
    document.addEventListener("mousemove", moveIcon);
    document.addEventListener("mouseup", upIcon);
  });
  function moveIcon(e) {
    if (!iconDrag) return;
    icon.style.left = (e.clientX-ix) + "px";
    icon.style.top  = (e.clientY-iy) + "px";
    icon.style.right = "auto";
  }
  function upIcon() {
    iconDrag = false;
    document.removeEventListener("mousemove", moveIcon);
    document.removeEventListener("mouseup", upIcon);
    chrome.storage.local.set({ iconLeft: icon.style.left, iconTop: icon.style.top });
  }

  // 2) Panel
  const panel = document.createElement("div");
  Object.assign(panel.style, {
    position:"fixed", top:"60px", right:"10px",
    width:"150px", height:"150px",
    background:"rgba(255,255,255,0.95)", padding:"4px",
    borderRadius:"6px", boxShadow:"0 1px 4px rgba(0,0,0,0.2)",
    display:"none", flexDirection:"column", zIndex:999998
  });
  panel.style.display="flex";
  document.body.appendChild(panel);
  icon.addEventListener("click", () => {
    panel.style.display = panel.style.display==="none" ? "flex" : "none";
  });
  chrome.storage.local.get(['panelLeft','panelTop'], d => {
    if(d.panelLeft && d.panelTop) Object.assign(panel.style, { left:d.panelLeft, top:d.panelTop, right:"auto" });
  });
  let panelDrag=false, px=0, py=0;
  panel.addEventListener("mousedown", e => {
    panelDrag = true;
    const r = panel.getBoundingClientRect();
    px = e.clientX - r.left; py = e.clientY - r.top;
    document.addEventListener("mousemove", movePanel);
    document.addEventListener("mouseup", upPanel);
  });
  function movePanel(e) {
    if(!panelDrag) return;
    panel.style.left = (e.clientX-px) + "px";
    panel.style.top  = (e.clientY-py) + "px";
    panel.style.right = "auto";
  }
  function upPanel() {
    panelDrag = false;
    document.removeEventListener("mousemove", movePanel);
    document.removeEventListener("mouseup", upPanel);
    chrome.storage.local.set({ panelLeft: panel.style.left, panelTop: panel.style.top });
  }

  // 3) Grid inside retro-TV frame
  const grid = document.createElement("div");
  grid.id = "juz-grid";
  const frame = document.createElement("div");
  frame.id = "surah-tv-frame";
  frame.appendChild(grid);
  panel.appendChild(frame);

  // 4) Verse overlay
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
  overlay.querySelector("#ayah-close").onclick = () => overlay.style.display="none";

  // ── D) SOLVER LOGIC ───────────────────────────────────────────────────────
  let unlocked = new Set();
  function renderGrid() {
    grid.innerHTML = "";
    for(let j=1;j<=30;j++){
      const b = document.createElement("button");
      b.textContent = j;
      b.className = "juz-btn" + (unlocked.has(j)?" unlocked":"");
      b.onclick = () => unlockAyah(j); // fallback
      grid.appendChild(b);
    }
  }
  renderGrid();

  function unlockAyah(j) {
    const list = juzMap[j]||[];
    if(!list.length) return;
    const {surah:s, ayah:a} = list[Math.floor(Math.random()*list.length)];
    const chap = chapters.find(c=>c.id===s)||{};
    fetch(`https://api.alquran.cloud/v1/ayah/${s}:${a}/editions/quran-uthmani,ar.alafasy,en.asad`)
      .then(r=>r.json())
      .then(js=>{
        const [ar,au,tr] = js.data;
        document.getElementById("ayah-header").innerHTML =
          `Juz ${j} — <span class="surah">${chap.name_arabic} / ${chap.name_complex}</span> — Ayah ${a}`;
        document.getElementById("ayah-text").textContent  = ar.text;
        document.getElementById("ayah-trans").textContent = tr.text;
        document.getElementById("ayah-audio").src        = au.audio;
        overlay.style.display = "block";
        if(!unlocked.has(j)){
          unlocked.add(j);
          renderGrid();
        }
      })
      .catch(console.error);
  }

  function triggerSolver() {
    icon.style.display  = "block";
    panel.style.display = "flex";
    unlockAyah(Math.floor(Math.random()*30)+1);
  }

  // ── E) WATCH FOR “ACCEPTED” WITH DELAY ────────────────────────────────────
  function startWatcher() {
    const obs = new MutationObserver(() => {
      const span = document.querySelector("span[data-cypress='judge-status-text']");
      if(span?.textContent.trim()==="Accepted") {
        obs.disconnect();
        chrome.storage.local.get("delayMinutes", ({ delayMinutes }) => {
          if(delayMinutes>0) {
            setTimeout(triggerSolver, delayMinutes*60000);
          } else if(delayMinutes<0) {
            triggerSolver();
          }
          // if zero, never
        });
      }
    });
    obs.observe(document.body, { childList:true, subtree:true });
    // immediate check
    if(document.body.innerText.includes("Accepted")) {
      chrome.storage.local.get("delayMinutes", ({ delayMinutes }) => {
        if(delayMinutes>0) {
          setTimeout(triggerSolver, delayMinutes*60000);
        } else if(delayMinutes<0) {
          triggerSolver();
        }
      });
    }
  }

  // ── F) INIT: load delayMinutes or show modal ─────────────────────────────
  chrome.storage.local.get("delayMinutes", ({ delayMinutes }) => {
    if (delayMinutes == null) {
      showModal();
    } else {
      modal.style.display = "none";
      startWatcher();
    }
  });
})();
