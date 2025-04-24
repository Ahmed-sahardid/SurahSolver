;(() => {
  console.log("🔍 Surah Solver content.js injected");

  // ── 1) HANDLE SHOW/CLOSE MESSAGES ───────────────────────────────────────
  chrome.runtime.onMessage.addListener(msg => {
    const modal = document.getElementById('qs-settings-modal');
    if (msg.action === 'showPanel') {
      if (modal) modal.remove();
      else showSettingsModal();
    } else if (msg.action === 'closePanel') {
      if (modal) {
        modal.remove();
        chrome.runtime.sendMessage({ action: 'panelClosed' });
      }
    }
  });

  // ── 2) AUTO-SHOW ON LOAD ────────────────────────────────────────────────
  showSettingsModal();
  function showSettingsModal() {
    const m = document.createElement('div');
    m.id = 'qs-settings-modal';
    m.innerHTML = `
      <div class="qs-modal">
        <div class="qs-console"></div>
        <div class="qs-menu">
          <h2>Show you an Ayah after:</h2>
          <ul>
            <li data-seconds="3">3 Seconds</li>
            <li data-minutes="5">5 Minutes</li>
            <li data-minutes="10">10 Minutes</li>
            <li data-minutes="15">15 Minutes</li>
            <li data-minutes="custom">
              Custom…<input type="number" class="custom-input" min="1" placeholder="min">
            </li>
          </ul>
          <div class="qs-buttons">
            <button id="qs-confirm">Confirm</button>
            <button id="qs-close">Close</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(m);

    let delayMs = null;
    const items = m.querySelectorAll('li');
    const inp   = m.querySelector('.custom-input');

    items.forEach(li => {
      li.addEventListener('click', () => {
        items.forEach(x => x.classList.remove('selected'));
        li.classList.add('selected');
        inp.style.display = li.dataset.minutes === 'custom' ? 'inline-block' : 'none';
        if (li.dataset.seconds)      delayMs = parseInt(li.dataset.seconds,10)*1000;
        else if (li.dataset.minutes) delayMs = parseInt(li.dataset.minutes,10)*60000;
        else                          delayMs = null;
      });
    });


    // CONFIRM = schedule & close panel
    m.querySelector('#qs-confirm').addEventListener('click', () => {
      if (delayMs === null) {
        const v = parseInt(inp.value,10);
        if (v > 0) delayMs = v * 60000;
        else return alert('Enter a valid number');
      }
      chrome.runtime.sendMessage({ action: 'startTimer', durationMs: delayMs });
      m.remove();
      chrome.runtime.sendMessage({ action: 'panelClosed' });
      if (delayMs > 0) startCountdown(Math.floor(delayMs/1000));
    });

    // CLOSE = just close panel
    m.querySelector('#qs-close').addEventListener('click', () => {
      m.remove();
      chrome.runtime.sendMessage({ action: 'panelClosed' });
    });
  }


  // ── 3) LOCATION & 12-HOUR SALAT TIMES ──────────────────────────────────
  function format12Hour(t24) {
    const [h, m] = t24.split(':').map(Number);
    const suff = h >= 12 ? 'PM' : 'AM';
    const h12 = ((h + 11) % 12) + 1;
    return `${h12}:${String(m).padStart(2,'0')} ${suff}`;
  }
  function getPrayerTimes(lat, lon) {
    const consoleEl = document.querySelector('.qs-console');
    fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=2`)
      .then(r=>r.json()).then(d=>{
        const t = d.data.timings;
        consoleEl.innerHTML = `
          <div style="color:#ffeb3b;font-size:14px;line-height:1.4;text-align:left;padding:8px;">
            <div id="location-label" style="font-weight:bold;margin-bottom:8px;">📍 Locating...</div>
            <strong>Prayer Times</strong><br>
            Fajr: ${format12Hour(t.Fajr)}<br>
            Dhuhr: ${format12Hour(t.Dhuhr)}<br>
            Asr: ${format12Hour(t.Asr)}<br>
            Maghrib: ${format12Hour(t.Maghrib)}<br>
            Isha: ${format12Hour(t.Isha)}
          </div>`;
      }).catch(()=>{ consoleEl.innerText = 'Could not load prayer times.'; });
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
      .then(r=>r.json()).then(loc=>{
        const city    = loc.address.city    || loc.address.town || '';
        const country = loc.address.country || '';
        const label   = city ? `${city}, ${country}` : country;
        const lbl     = document.getElementById('location-label');
        if (lbl) lbl.innerText = `📍 ${label}`;
      }).catch(()=>{});
  }
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      p => getPrayerTimes(p.coords.latitude,p.coords.longitude),
      () => document.querySelector('.qs-console').innerText = 'Enable location to see Salat times.'
    );
  } else {
    document.querySelector('.qs-console').innerText = 'Geolocation not supported.';
  }
  // ── 4) INJECT CSS ─────────────────────────────────────────────────────────
  const css = document.createElement('style');
  css.textContent = `
    /* SETTINGS MODAL */
    #qs-settings-modal { position:fixed;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);z-index:100000;font-family:'Press Start 2P',monospace; }
    #qs-settings-modal .qs-modal { display:flex;width:700px;height:400px;background:#c62828;border:8px solid #7f0000;border-radius:16px;overflow:hidden; }
    #qs-settings-modal .qs-console { flex:1;background:#222;color:#ffeb3b;font-size:16px;padding:12px;box-sizing:border-box;overflow:auto; }
    #qs-settings-modal .qs-console::after { content:none!important; }
    #qs-settings-modal .qs-menu { flex:1;background:#ffeb3b;padding:20px;box-sizing:border-box;display:flex;flex-direction:column; }
    #qs-settings-modal h2 { margin:0 0 16px;font-size:18px;text-align:center; }
    #qs-settings-modal ul { list-style:none;padding:0;margin:0;flex:1;overflow:auto; }
    #qs-settings-modal li { margin:8px 0;padding-left:20px;cursor:pointer;position:relative;user-select:none; }
    #qs-settings-modal li::before { content:'›';position:absolute;left:0;color:#333; }
    #qs-settings-modal li.selected { background:#f57f17; }
    .custom-input { margin-left:20px;width:60px;padding:4px;font-size:14px;display:none; }
    .qs-buttons { text-align:right;margin-top:12px; }
    .qs-buttons button { background:#333;color:#ffeb3b;border:none;padding:8px 16px;font-size:14px;cursor:pointer;border-radius:4px; }
    /* AYAH OVERLAY */
    #ayah-overlay { display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);align-items:center;justify-content:center;padding:20px;box-sizing:border-box;font-family:sans-serif;z-index:999999; }
    #ayah-box { position:relative;background:#fff;border-radius:8px;max-width:600px;width:100%;padding:24px;display:flex;flex-direction:column;align-items:stretch; }
    #ayah-timer { position:absolute;top:8px;right:12px;font-size:14px;color:#555; }
    #ayah-header { font-weight:bold;text-align:center;margin-bottom:16px;font-size:16px; }
    #ayah-text { font-family:'Scheherazade',serif;font-size:1.6em;direction:rtl;text-align:right;background:#ffffe0;padding:12px;border-radius:4px;margin-bottom:12px; }
    #ayah-trans { font-style:italic;margin-bottom:12px;color:#333;text-align:left; }
    .ayat-audio-container { display:flex;align-items:center;gap:8px;margin-bottom:16px; }
    .ayat-controls { display:flex;justify-content:space-between;margin-bottom:12px; }
    .ayat-controls button { background:#b71c1c;color:#fff;border:none;padding:8px 12px;border-radius:4px;cursor:pointer;flex:1;margin:0 4px; }
    #ayah-end { background:#444;color:#fff;border:none;padding:10px 16px;border-radius:4px;cursor:pointer;font-size:14px;align-self:center;margin-top:8px; }
    #ayah-end:hover { background:#555; }
    /* COUNTDOWN CIRCLE */
    #qs-countdown { position:fixed;top:20px;right:20px;width:80px;height:80px;background:#c62828;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;z-index:1000001; }
    #qs-countdown .countdown-arabic { font-size:24px;line-height:1; }
    #qs-countdown .countdown-numeric { font-size:16px;line-height:1; }
  `;
  document.head.appendChild(css);
  // ── 5) ARABIC DIGITS & STATE ──────────────────────────────────────────────
  const arabicDigits = { '0':'٠','1':'١','2':'٢','3':'٣','4':'٤','5':'٥','6':'٦','7':'٧','8':'٨','9':'٩' };
  function toArabic(n) { return String(n).split('').map(d=>arabicDigits[d]||d).join(''); }
  let chapters = [], offsets = [0], totalAyahs = 0, currentIndex = 0;
  let availableReciters = [], currentSurah = 1, currentAyah = 1;
  let showRandomAyah = () => {};
  function idxToSurahAyah(idx) {
    if (idx < 0) idx = totalAyahs - 1;
    if (idx >= totalAyahs) idx = 0;
    let s = 1; while (s <= chapters.length && offsets[s] <= idx) s++;
    s--;
    return { surah: s, ayah: idx - offsets[s] + 1, idx };
  }
  // ── 6) FETCH RECITERS & CHAPTERS ─────────────────────────────────────────
  fetch("https://api.alquran.cloud/v1/edition?format=audio")
    .then(r=>r.json()).then(js=>availableReciters=js.data).catch(()=>{});
  fetch("https://api.quran.com/api/v4/chapters?language=en")
    .then(r=>r.json()).then(j=>{ chapters = j.chapters; for(let i=0;i<chapters.length;i++) offsets[i+1] = offsets[i] + chapters[i].verses_count; totalAyahs = offsets[chapters.length]; createOverlay(); }).catch(()=>{});
  // ── 7) COUNTDOWN ─────────────────────────────────────────────────────────
  function startCountdown(sec) {
    let rem = sec;
    const cd = document.createElement("div"); cd.id="qs-countdown";
    cd.innerHTML = `<div class="countdown-arabic">${toArabic(rem)}</div><div class="countdown-numeric">${rem}</div>`;
    document.body.appendChild(cd);
    const iv = setInterval(()=>{
      rem--;
      if(rem<=0){ clearInterval(iv); cd.remove(); showRandomAyah(); }
      else {
        cd.querySelector(".countdown-arabic").textContent = toArabic(rem);
        cd.querySelector(".countdown-numeric").textContent = rem;
      }
    },1000);
  }
  // ── 8) AYAH OVERLAY ───────────────────────────────────────────────────────
  function createOverlay() {
    const ov = document.createElement("div"); ov.id = "ayah-overlay";
    ov.innerHTML = `
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
        <button id="ayah-end">End Session</button>
      </div>`;
    document.body.appendChild(ov);
    const timerEl = ov.querySelector("#ayah-timer"),
          hdr     = ov.querySelector("#ayah-header"),
          txt     = ov.querySelector("#ayah-text"),
          trn     = ov.querySelector("#ayah-trans"),
          sel     = ov.querySelector("#reciter-select"),
          audio   = ov.querySelector("#ayah-audio"),
          btnP    = ov.querySelector("#ayat-prev"),
          btnR    = ov.querySelector("#ayat-random"),
          btnN    = ov.querySelector("#ayat-next"),
          btnE    = ov.querySelector("#ayah-end");
    let ti;
    function readTimer() {
      clearInterval(ti);
      const start = Date.now();
      timerEl.textContent = "00:00";
      ti = setInterval(() => {
        const s  = Math.floor((Date.now() - start) / 1000),
              mm = String(Math.floor(s / 60)).padStart(2,"0"),
              ss = String(s % 60).padStart(2,"0");
        timerEl.textContent = `${mm}:${ss}`;
      }, 1000);
    }
    function loadAudio(id) {
      fetch(`https://api.alquran.cloud/v1/ayah/${currentSurah}:${currentAyah}/${id}`)
        .then(r=>r.json()).then(js=>{ audio.src = js.data.audio; })
        .catch(()=>{});
    }
    function showAyah(s,a,i) {
      currentIndex = i; currentSurah = s; currentAyah = a;
      const c = chapters.find(x=>x.id===s) || {};
      hdr.textContent = `Surah ${c.name_complex} (${c.name_arabic}) — Ayah ${a}`;
      fetch(`https://api.alquran.cloud/v1/ayah/${s}:${a}/editions/quran-uthmani,en.asad`)
        .then(r=>r.json()).then(js=>{
          txt.textContent = js.data[0].text;
          trn.textContent = js.data[1].text;
          sel.innerHTML = "";
          availableReciters.forEach(r=> {
            const o = document.createElement("option");
            o.value = r.identifier; o.textContent = r.englishName||r.name;
            sel.appendChild(o);
          });
          loadAudio(sel.value);
          ov.style.display = "flex";
          readTimer();
        })
        .catch(()=>{});
    }
    showRandomAyah = () => {
      const r = Math.floor(Math.random() * totalAyahs);
      const o = idxToSurahAyah(r);
      showAyah(o.surah, o.ayah, o.idx);
    };
    btnP.onclick = () => { const o = idxToSurahAyah(currentIndex - 1); showAyah(o.surah,o.ayah,o.idx); };
    btnN.onclick = () => { const o = idxToSurahAyah(currentIndex + 1); showAyah(o.surah,o.ayah,o.idx); };
    btnR.onclick = showRandomAyah;
    sel.onchange    = () => loadAudio(sel.value);
    btnE.onclick    = () => { ov.style.display = "none"; clearInterval(ti); showSettingsModal(); };
  }
  // ── 9) SETTINGS MODAL ──────────────────────────────────────────────────────
  function showSettingsModal() {
    const m = document.createElement("div");
    m.id = "qs-settings-modal";
    m.innerHTML = `
      <div class="qs-modal">
        <div class="qs-console"></div>
        <div class="qs-menu">
          <h2>Show you an Ayah after:</h2>
          <ul>
            <li data-seconds="3">3 Seconds</li>
            <li data-minutes="5">5 Minutes</li>
            <li data-minutes="10">10 Minutes</li>
            <li data-minutes="15">15 Minutes</li>
            <li data-minutes="custom"><input type="number" class="custom-input" min="1" placeholder="min">Custom…</li>
          </ul>
          <div class="qs-buttons">
            <button id="qs-confirm">Confirm</button>
            <button id="qs-close">Close</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(m);
    let delayMs = null;
    const items = m.querySelectorAll("li");
    const inp   = m.querySelector(".custom-input");
    items.forEach(li => {
      li.addEventListener("click", () => {
        items.forEach(x => x.classList.remove("selected"));
        li.classList.add("selected");
        inp.style.display = li.dataset.minutes === "custom" ? "inline-block" : "none";
        if (li.dataset.seconds)       delayMs = parseInt(li.dataset.seconds) * 1000;
        else if (li.dataset.minutes)  delayMs = parseInt(li.dataset.minutes) * 60000;
        else                           delayMs = null;
      });
    });
    m.querySelector("#qs-confirm").addEventListener("click", () => {
      if (delayMs === null) {
        const v = parseInt(inp.value,10);
        if (v>0) delayMs = v*60000;
        else return alert("Enter a valid number");
      }
      chrome.runtime.sendMessage({ action:"startTimer", durationMs: delayMs });
      m.remove();
      if (delayMs>0) startCountdown(Math.floor(delayMs/1000));
    });
    m.querySelector("#qs-close").addEventListener("click", () => m.remove());
  }
})();