;(() => {
  console.log("🔍 Surah Solver content.js injected");

  // ── LOCATION & SALAT TIME INTEGRATION ───────────────────────────────
  function getPrayerTimes(lat, lon) {
    fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=2`)
      .then(res => res.json())
      .then(data => {
        const times = data.data.timings;
        const salatHtml = `
          <div style="font-size: 14px; text-align: left; padding: 8px;">
            <strong>Prayer Times</strong><br>
            Fajr: ${times.Fajr}<br>
            Dhuhr: ${times.Dhuhr}<br>
            Asr: ${times.Asr}<br>
            Maghrib: ${times.Maghrib}<br>
            Isha: ${times.Isha}
          </div>`;
        document.querySelector(".qs-console").innerHTML = salatHtml;
      })
      .catch(err => {
        console.error("Failed to load prayer times:", err);
        document.querySelector(".qs-console").innerText = "Could not load prayer times";
      });
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => getPrayerTimes(pos.coords.latitude, pos.coords.longitude),
      err => {
        console.error("Location permission denied:", err);
        document.querySelector(".qs-console").innerText = "Enable location to see Salat times";
      }
    );
  } else {
    document.querySelector(".qs-console").innerText = "Geolocation not supported";
  }

  // ── 0) INJECT ALL CSS ─────────────────────────────────────────────────────
  const css = document.createElement("style");
  css.textContent = `
    /* SETTINGS MODAL */
    #qs-settings-modal {
      position: fixed; top: 0; left: 0;
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.6);
      z-index: 100000;
      font-family: 'Press Start 2P', monospace;
    }
    #qs-settings-modal .qs-modal {
      display: flex; width: 700px; height: 400px;
      background: #c62828; border: 8px solid #7f0000;
      border-radius: 16px; overflow: hidden;
      box-shadow: 0 0 20px rgba(0,0,0,0.8);
    }
    #qs-settings-modal .qs-console {
      flex: 1; background: #222;
      display: flex; align-items: center; justify-content: center;
      color: #ffeb3b; font-size: 48px;
    }
    #qs-settings-modal .qs-console::after { content: "Q"; }
    #qs-settings-modal .qs-menu {
      flex: 1; background: #ffeb3b;
      padding: 20px; box-sizing: border-box;
      display: flex; flex-direction: column; justify-content: space-between;
    }
    #qs-settings-modal h2 {
      margin: 0 0 16px; font-size: 18px; text-align: center;
    }
    #qs-settings-modal ul { list-style: none; padding: 0; margin: 0; flex: 1; }
    #qs-settings-modal li {
      margin: 8px 0; padding-left: 20px;
      position: relative; cursor: pointer; user-select: none;
    }
    #qs-settings-modal li::before {
      content: '›'; position: absolute; left: 0; color: #333;
    }
    #qs-settings-modal li.selected { background: #f57f17; }
    #qs-settings-modal .custom-input {
      margin-left: 20px; width: 60px; font-size: 14px;
      padding: 4px; display: none;
    }
    #qs-settings-modal .qs-buttons { text-align: right; }
    #qs-settings-modal button {
      background: #333; color: #ffeb3b; border: none;
      padding: 8px 16px; font-size: 14px;
      cursor: pointer; border-radius: 4px; margin-left: 8px;
    }

    /* AYAH OVERLAY (hidden by default) */
    #ayah-overlay {
      display: none;
      position: fixed; top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.8);
      align-items: center; justify-content: center;
      padding: 20px; box-sizing: border-box;
      font-family: sans-serif; z-index: 999999;
    }
    #ayah-box {
      position: relative;
      background: #fff; border-radius: 8px;
      max-width: 600px; width: 100%; padding: 24px;
      display: flex; flex-direction: column; align-items: stretch;
    }
    #ayah-timer {
      position: absolute; top: 8px; right: 12px;
      font-size: 14px; color: #555;
    }
    #ayah-header {
      font-weight: bold; text-align: center;
      margin-bottom: 16px; font-size: 16px;
    }
    #ayah-text {
      font-family: 'Scheherazade', serif;
      font-size: 1.6em; direction: rtl; text-align: right;
      background: #ffffe0; padding: 12px;
      border-radius: 4px; margin-bottom: 12px;
    }
    #ayah-trans {
      font-style: italic; margin-bottom: 12px;
      color: #333; text-align: left;
    }
    .ayat-audio-container {
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 16px;
    }
    .ayat-controls {
      display: flex; justify-content: space-between;
      margin-bottom: 12px;
    }
    .ayat-controls button {
      background: #b71c1c; color: #fff;
      border: none; padding: 8px 12px;
      border-radius: 4px; cursor: pointer;
      flex: 1; margin: 0 4px;
    }
    #ayah-close {
      background: #eee; color: #333; border: none;
      padding: 10px; border-radius: 4px;
      cursor: pointer; font-size: 14px;
      align-self: center;
    }
    #ayah-close:hover { background: #ddd; }

    /* END SESSION BUTTON */
    #ayah-end {
      background: #444; color: #fff; border: none;
      padding: 10px 16px; border-radius: 4px;
      cursor: pointer; font-size: 14px;
      align-self: center; margin-top: 8px;
    }
    #ayah-end:hover { background: #555; }

    /* COUNTDOWN CIRCLE */
    #qs-countdown {
      position: fixed; top: 20px; right: 20px;
      width: 80px; height: 80px;
      background: #c62828; border-radius: 50%;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      color: white; z-index: 1000001;
    }
    #qs-countdown .countdown-arabic {
      font-size: 24px; line-height: 1;
    }
    #qs-countdown .countdown-numeric {
      font-size: 16px; line-height: 1;
    }
  `;
  document.head.appendChild(css);

  // ── 1) ARABIC DIGITS UTILITY & STATE ───────────────────────────────────────
  const arabicDigits = { '0':'٠','1':'١','2':'٢','3':'٣','4':'٤','5':'٥','6':'٦','7':'٧','8':'٨','9':'٩' };
  function toArabic(num) {
    return String(num).split('').map(d => arabicDigits[d] || d).join('');
  }

  let chapters = [], offsets = [0], totalAyahs = 0, currentIndex = 0;
  let availableReciters = [], currentSurah = 1, currentAyah = 1;
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

  // ── 2) FETCH RECITERS & CHAPTER METADATA ───────────────────────────────────
  fetch("https://api.alquran.cloud/v1/edition?format=audio")
    .then(r => r.json())
    .then(js => { availableReciters = js.data; })
    .catch(err => console.error("Failed loading reciters:", err));

  fetch("https://api.quran.com/api/v4/chapters?language=en")
    .then(r => r.json())
    .then(j => {
      chapters = j.chapters;
      for (let i = 0; i < chapters.length; i++) {
        offsets[i + 1] = offsets[i] + chapters[i].verses_count;
      }
      totalAyahs = offsets[chapters.length];
      createOverlay();
      showSettingsModal();
    })
    .catch(err => {
      console.error("Failed loading chapters:", err);
      createOverlay();
      showSettingsModal();
    });

  // ── 3) COUNTDOWN HANDLER ───────────────────────────────────────────────────
  function startCountdown(seconds) {
    let remaining = seconds;
    const countdown = document.createElement("div");
    countdown.id = "qs-countdown";
    countdown.innerHTML = `
      <div class="countdown-arabic">${toArabic(remaining)}</div>
      <div class="countdown-numeric">${remaining}</div>
    `;
    document.body.appendChild(countdown);

    const interval = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(interval);
        countdown.remove();
        showRandomAyah();
      } else {
        countdown.querySelector(".countdown-arabic").textContent = toArabic(remaining);
        countdown.querySelector(".countdown-numeric").textContent = remaining;
      }
    }, 1000);
  }

  // ── 4) BUILD THE AYAH OVERLAY ──────────────────────────────────────────────
  function createOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "ayah-overlay";
    overlay.innerHTML = `
      <div id="ayah-box">
        <div id="ayah-timer">00:00</div>
        <div id="ayah-header"></div>
        <div id="ayah-text"></div>
        <div id="ayah-trans"></div>
        <div class="ayat-audio-container">
          <label for="reciter-select">Reciter:</label>
          <select id="reciter-select"></select>
          <audio id="ayah-audio" controls></audio>
        </div>
        <div class="ayat-controls">
          <button id="ayat-prev">Before</button>
          <button id="ayat-random">Random</button>
          <button id="ayat-next">After</button>
        </div>
        <button id="ayah-close">Close</button>
        <button id="ayah-end">End Session</button>
      </div>`;
    document.body.appendChild(overlay);

    const timerEl       = overlay.querySelector("#ayah-timer");
    const hdr           = overlay.querySelector("#ayah-header");
    const txt           = overlay.querySelector("#ayah-text");
    const trn           = overlay.querySelector("#ayah-trans");
    const reciterSelect = overlay.querySelector("#reciter-select");
    const audioEl       = overlay.querySelector("#ayah-audio");
    const btnPrev       = overlay.querySelector("#ayat-prev");
    const btnRand       = overlay.querySelector("#ayat-random");
    const btnNext       = overlay.querySelector("#ayat-next");
    const btnClose      = overlay.querySelector("#ayah-close");
    const btnEnd        = overlay.querySelector("#ayah-end");

    let timerInterval;
    function startReadingTimer() {
      clearInterval(timerInterval);
      const start = Date.now();
      timerEl.textContent = "00:00";
      timerInterval = setInterval(() => {
        const secs = Math.floor((Date.now() - start) / 1000);
        const m = String(Math.floor(secs / 60)).padStart(2, "0");
        const s = String(secs % 60).padStart(2, "0");
        timerEl.textContent = `${m}:${s}`;
      }, 1000);
    }

    function loadAudio(reciterID) {
      const endpoint =
        "https://api.alquran.cloud/v1/ayah/" +
        currentSurah + ":" +
        currentAyah  + "/" +
        reciterID;

      fetch(endpoint)
        .then(r => r.json())
        .then(js => { audioEl.src = js.data.audio; })
        .catch(err => {
          console.error("Failed loading audio for " + reciterID + ":", err);
        });
    }

    function showAyah(surah, ayah, idx) {
      currentIndex = idx; currentSurah = surah; currentAyah = ayah;
      const chap = chapters.find(c => c.id === surah) || {};
      hdr.textContent = `Surah ${chap.name_complex} (${chap.name_arabic}) — Ayah ${ayah}`;

      fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/editions/quran-uthmani,en.asad`)
        .then(r => r.json())
        .then(js => {
          const [ar, tr] = js.data;
          txt.textContent = ar.text;
          trn.textContent = tr.text;

          reciterSelect.innerHTML = "";
          availableReciters.forEach(rec => {
            const opt = document.createElement("option");
            opt.value = rec.identifier;
            opt.textContent = rec.englishName || rec.name;
            reciterSelect.appendChild(opt);
          });

          loadAudio(reciterSelect.value);
          overlay.style.display = "flex";
          startReadingTimer();
        })
        .catch(err => console.error("Failed loading ayah text:", err));
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
    btnRand.onclick = showRandomAyah;
    reciterSelect.onchange = () => loadAudio(reciterSelect.value);
    btnClose.onclick = () => {
      overlay.style.display = "none";
      clearInterval(timerInterval);
    };
    btnEnd.onclick = () => {
      overlay.style.display = "none";
      clearInterval(timerInterval);
      showSettingsModal();
    };
  }

  // ── 5) SETTINGS MODAL ─────────────────────────────────────────────────────
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

    modal.querySelector("#qs-save").addEventListener("click", () => {
      if (delayMs === null) {
        const v = parseInt(customInput.value, 10);
        if (v > 0) delayMs = v * 60000;
        else return alert("Enter a valid number");
      }
      modal.remove();
      if (delayMs > 0) startCountdown(Math.floor(delayMs / 1000));
    });

    modal.querySelector("#qs-reset").addEventListener("click", () => {
      delayMs = null;
      items.forEach(x => x.classList.remove("selected"));
      customInput.style.display = "none";
      customInput.value = "";
      modal.style.display = "flex";
    });

    modal.style.display = "flex";
  }
})();
