// overlay.js

let chapters = [], offsets = [0], totalAyahs = 0, currentIndex = 0;
let availableReciters = [], currentSurah = 1, currentAyah = 1;
let showRandomAyah = () => {};

function idxToSurahAyah(idx) {
  if (idx < 0) idx = totalAyahs - 1;
  if (idx >= totalAyahs) idx = 0;
  let s = 1;
  while (s <= chapters.length && offsets[s] <= idx) s++;
  s--;
  return { surah: s, ayah: idx - offsets[s] + 1, idx };
}

function createOverlay() {
  const ov = document.createElement("div");
  ov.id = "ayah-overlay";
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
      <button id="ayah-close">Close</button>
      <button id="ayah-end">End Session</button>
    </div>`;
  document.body.appendChild(ov);

  const timerEl       = ov.querySelector("#ayah-timer"),
        hdr           = ov.querySelector("#ayah-header"),
        txt           = ov.querySelector("#ayah-text"),
        trn           = ov.querySelector("#ayah-trans"),
        sel           = ov.querySelector("#reciter-select"),
        audioEl       = ov.querySelector("#ayah-audio"),
        btnPrev       = ov.querySelector("#ayat-prev"),
        btnRand       = ov.querySelector("#ayat-random"),
        btnNext       = ov.querySelector("#ayat-next"),
        btnClose      = ov.querySelector("#ayah-close"),
        btnEnd        = ov.querySelector("#ayah-end");

  let ti;
  function startReadTimer() {
    clearInterval(ti);
    const start = Date.now();
    timerEl.textContent = "00:00";
    ti = setInterval(() => {
      const s = Math.floor((Date.now() - start) / 1000),
            mm = String(Math.floor(s/60)).padStart(2,"0"),
            ss = String(s%60).padStart(2,"0");
      timerEl.textContent = `${mm}:${ss}`;
    }, 1000);
  }

  function loadAudio(reciterID) {
    fetch(`https://api.alquran.cloud/v1/ayah/${currentSurah}:${currentAyah}/${reciterID}`)
      .then(r=>r.json())
      .then(js=>{ audioEl.src = js.data.audio; })
      .catch(()=>{});
  }

  function showAyah(surah, ayah, idx) {
    currentIndex = idx; currentSurah = surah; currentAyah = ayah;
    const chap = chapters.find(c => c.id === surah) || {};
    hdr.textContent = `Surah ${chap.name_complex} (${chap.name_arabic}) — Ayah ${ayah}`;

    fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/editions/quran-uthmani,en.asad`)
      .then(r=>r.json())
      .then(js=>{
        txt.textContent = js.data[0].text;
        trn.textContent = js.data[1].text;
        sel.innerHTML = "";
        availableReciters.forEach(rec => {
          const o = document.createElement("option");
          o.value = rec.identifier;
          o.textContent = rec.englishName || rec.name;
          sel.appendChild(o);
        });
        loadAudio(sel.value);
        ov.style.display = "flex";
        startReadTimer();
      })
      .catch(()=>{});
  }

  showRandomAyah = () => {
    const r = Math.floor(Math.random() * totalAyahs);
    const { surah, ayah, idx } = idxToSurahAyah(r);
    showAyah(surah, ayah, idx);
  };

  btnPrev.onclick = () => {
    const o = idxToSurahAyah(currentIndex - 1);
    showAyah(o.surah, o.ayah, o.idx);
  };
  btnNext.onclick = () => {
    const o = idxToSurahAyah(currentIndex + 1);
    showAyah(o.surah, o.ayah, o.idx);
  };
  btnRand.onclick   = showRandomAyah;
  sel.onchange      = () => loadAudio(sel.value);
  btnClose.onclick  = () => { ov.style.display = "none"; clearInterval(ti); };
  btnEnd.onclick    = () => { ov.style.display = "none"; clearInterval(ti); showSettingsModal(); };
}
