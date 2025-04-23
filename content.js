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
      flex:1; background:#ffeb3b; padding:20px; box-sizing:border-box;
      display:flex; flex-direction:column; justify-content:space-between;
    }
    #qs-settings-modal h2 {
      margin:0 0 16px; font-size:18px; text-align:center;
    }
    #qs-settings-modal ul {
      list-style:none; padding:0; margin:0; flex:1;
    }
    #qs-settings-modal li {
      margin:8px 0; padding-left:20px; position:relative;
      cursor:pointer; user-select:none;
    }
    #qs-settings-modal li::before {
      content:'›'; position:absolute; left:0; color:#333;
    }
    #qs-settings-modal li.selected { background:#f57f17; }
    #qs-settings-modal .custom-input {
      margin-left:20px; width:60px; font-size:14px;
      padding:4px; display:none;
    }
    #qs-settings-modal .qs-buttons { text-align:right; }
    #qs-settings-modal button {
      background:#333; color:#ffeb3b; border:none;
      padding:8px 16px; font-size:14px; cursor:pointer;
      border-radius:4px; margin-left:8px;
    }

    /* AYAH OVERLAY */
    #ayah-overlay {
      display:none; position:fixed; top:0; left:0;
      width:100%; height:100%; background:rgba(0,0,0,0.8);
      display:flex; align-items:center; justify-content:center;
      padding:20px; box-sizing:border-box; z-index:999999;
      font-family:sans-serif;
    }
    #ayah-box {
      background:#fff; border-radius:8px;
      max-width:600px; width:100%; padding:24px;
      display:flex; flex-direction:column; align-items:stretch;
    }
    #ayah-header {
      font-weight:bold; text-align:center;
      margin-bottom:16px; font-size:16px;
    }
    #ayah-text {
      font-family:'Scheherazade',serif; font-size:1.6em;
      direction:rtl; text-align:right; background:#ffffe0;
      padding:12px; border-radius:4px; margin-bottom:12px;
    }
    #ayah-trans {
      font-style:italic; margin-bottom:12px; color:#333;
      text-align:left;
    }
    #ayah-audio {
      width:100%; margin-bottom:16px;
    }
    .ayat-controls {
      display:flex; justify-content:space-between;
      margin-bottom:12px;
    }
    .ayat-controls button {
      background:#b71c1c; color:#fff; border:none;
      padding:8px 12px; border-radius:4px; cursor:pointer;
      flex:1; margin:0 4px;
    }
    #ayah-close {
      background:#eee; color:#333; border:none;
      padding:10px; border-radius:4px; cursor:pointer;
      font-size:14px; align-self:center;
    }
    #ayah-close:hover { background:#ddd; }
  `;
  document.head.appendChild(css);

  // ── 1) SHOW SETTINGS MODAL IMMEDIATELY ────────────────────────────────────
  showSettingsModal();

  // ── 2) STATE & HELPERS ────────────────────────────────────────────────────
  let chapters = [], offsets = [0], totalAyahs = 0, currentIndex = 0;
  let showRandomAyah = () => {};

  function idxToSurahAyah(idx) {
    if (idx < 0) idx = totalAyahs - 1;
    if (idx >= totalAyahs) idx = 0;
    let s = 1;
    while (s <= chapters.length && offsets[s] <= idx) s++;
    s--;
    const ayah = idx - offsets[s] + 1;
    return { surah: s, ayah, idx };
  }

  // ── 3) LOAD METADATA THEN CREATE OVERLAY ─────────────────────────────────
  fetch("https://api.quran.com/api/v4/chapters?language=en")
    .then(r => r.json())
    .then(j => {
      chapters = j.chapters;
      for (let i = 0; i < chapters.length; i++) {
        offsets[i+1] = offsets[i] + chapters[i].verses_count;
      }
      totalAyahs = offsets[chapters.length];
      createOverlay();
    })
    .catch(console.error);

  // ── 4) CREATE AYAH OVERLAY (HIDDEN) ───────────────────────────────────────
  function createOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "ayah-overlay";
    overlay.innerHTML = `
      <div id="ayah-box">
        <div id="ayah-header"></div>
        <div id="ayah-text"></div>
        <div id="ayah-trans"></div>
        <audio id="ayah-audio" controls></audio>
        <div class="ayat-controls">
          <button id="ayat-prev">Before</button>
          <button id="ayat-random">Random</button>
          <button id="ayat-next">After</button>
        </div>
        <button id="ayah-close">Close</button>
      </div>`;
    document.body.appendChild(overlay);

    const hdr     = overlay.querySelector("#ayah-header");
    const txt     = overlay.querySelector("#ayah-text");
    const trn     = overlay.querySelector("#ayah-trans");
    const aud     = overlay.querySelector("#ayah-audio");
    const btnPrev = overlay.querySelector("#ayat-prev");
    const btnRand = overlay.querySelector("#ayat-random");
    const btnNext = overlay.querySelector("#ayat-next");
    const btnClose= overlay.querySelector("#ayah-close");

    function showAyah(surah, ayah, idx) {
      currentIndex = idx;
      const chap = chapters.find(c => c.id===surah) || {};
      hdr.textContent = `Surah ${chap.name_complex} (${chap.name_arabic}) — Ayah ${ayah}`;
      fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/editions/quran-uthmani,ar.alafasy,en.asad`)
        .then(r=>r.json()).then(js=>{
          const [ar, au, tr] = js.data;
          txt.textContent  = ar.text;
          trn.textContent  = tr.text;
          aud.src          = au.audio;
          overlay.style.display = "flex";
        })
        .catch(console.error);
    }

    showRandomAyah = () => {
      const rand = Math.floor(Math.random() * totalAyahs);
      const { surah, ayah, idx } = idxToSurahAyah(rand);
      showAyah(surah, ayah, idx);
    };

    btnPrev.onclick = () => {
      const { surah, ayah, idx } = idxToSurahAyah(currentIndex - 1);
      showAyah(surah, ayah, idx);
    };
    btnNext.onclick = () => {
      const { surah, ayah, idx } = idxToSurahAyah(currentIndex + 1);
      showAyah(surah, ayah, idx);
    };
    btnRand.onclick  = showRandomAyah;
    btnClose.onclick = () => overlay.style.display = "none";
  }

  // ── 5) SETTINGS MODAL DEFINITION ──────────────────────────────────────────
  function showSettingsModal() {
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
            <li data-minutes="custom">
              Custom…<input type="number" class="custom-input" min="1" placeholder="min">
            </li>
          </ul>
          <div class="qs-buttons">
            <button id="qs-save">Confirm</button>
            <button id="qs-reset">Reset</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);

    let delayMs = null;
    const items       = modal.querySelectorAll("li");
    const customInput = modal.querySelector(".custom-input");

    items.forEach(li => {
      li.addEventListener("click", () => {
        items.forEach(x => x.classList.remove("selected"));
        li.classList.add("selected");
        if (li.dataset.seconds) {
          delayMs = parseInt(li.dataset.seconds,10)*1000;
          customInput.style.display = "none";
        } else if (li.dataset.minutes === "custom") {
          delayMs = null;
          customInput.style.display = "inline-block";
          customInput.focus();
        } else {
          delayMs = parseInt(li.dataset.minutes,10)*60000;
          customInput.style.display = "none";
        }
      });
    });

    modal.querySelector("#qs-save").onclick = () => {
      if (delayMs === null) {
        const v = parseInt(customInput.value,10);
        if (v>0) delayMs = v*60000;
        else return alert("Enter a valid number");
      }
      modal.remove();
      if (delayMs > 0) setTimeout(showRandomAyah, delayMs);
    };

    modal.querySelector("#qs-reset").onclick = () => {
      delayMs = null;
      items.forEach(x => x.classList.remove("selected"));
      customInput.style.display = "none";
      customInput.value = "";
      modal.style.display = "flex";
    };

    modal.style.display = "flex";
  }
})();
