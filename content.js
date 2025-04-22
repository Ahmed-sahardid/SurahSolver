// content.js

// 1) Poll for “Accepted” and notify background
console.log("SurahSolver polling for Accepted");
let triggered = false;
function poll() {
  if (!triggered && document.body.innerText.includes("Accepted")) {
    triggered = true;
    const diff =
      document.querySelector("[diff]")?.getAttribute("diff")?.toLowerCase() ||
      "easy";
    chrome.runtime.sendMessage({ type: "PROBLEM_SOLVED", difficulty: diff });
  }
  setTimeout(poll, 2000);
}
poll();

// 2) Floating toggle button
const btn = document.createElement("div");
Object.assign(btn.style, {
  position: "fixed",
  top: "10px",
  right: "10px",
  width: "40px",
  height: "40px",
  background: `url(${chrome.runtime.getURL(
    "icons/icon128.png"
  )}) center/contain no-repeat`,
  cursor: "pointer",
  zIndex: 999999,
});
btn.onclick = () =>
  (panel.style.display = panel.style.display === "none" ? "flex" : "none");
document.body.appendChild(btn);

// 3) Panel (150×150, draggable)
const panel = document.createElement("div");
Object.assign(panel.style, {
  position: "fixed",
  top: "60px",
  right: "10px",
  width: "150px",
  height: "150px",
  background: "rgba(255,255,255,0.95)",
  padding: "4px",
  borderRadius: "6px",
  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
  display: "flex",
  flexDirection: "column",
  zIndex: 999998,
});
document.body.appendChild(panel);

// Restore last position
chrome.storage.local.get(["panelLeft", "panelTop"], (d) => {
  if (d.panelLeft && d.panelTop) {
    Object.assign(panel.style, {
      left: d.panelLeft,
      top: d.panelTop,
      right: "auto",
    });
  }
});

// Drag & persist
let dragging = false,
  ox = 0,
  oy = 0;
panel.addEventListener("mousedown", (e) => {
  dragging = true;
  const r = panel.getBoundingClientRect();
  ox = e.clientX - r.left;
  oy = e.clientY - r.top;
  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", onUp);
});
function onDrag(e) {
  if (!dragging) return;
  panel.style.left = e.clientX - ox + "px";
  panel.style.top = e.clientY - oy + "px";
  panel.style.right = "auto";
}
function onUp() {
  dragging = false;
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", onUp);
  chrome.storage.local.set({
    panelLeft: panel.style.left,
    panelTop: panel.style.top,
  });
}

// 4) Header with Back button
const header = document.createElement("div");
header.hidden = true; // only visible in Surah view
Object.assign(header.style, {
  flexShrink: "0",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  marginBottom: "2px",
});
const backBtn = document.createElement("button");
backBtn.textContent = "←";
Object.assign(backBtn.style, {
  width: "24px",
  height: "24px",
  padding: "0",
  border: "none",
  borderRadius: "3px",
  background: "#eee",
  cursor: "pointer",
  fontSize: "14px",
  lineHeight: "1",
});
backBtn.onclick = () => {
  header.hidden = true;
  surahGrid.hidden = true;
  juzGrid.hidden = false;
};
header.appendChild(backBtn);
panel.appendChild(header);

// 5) Surah grid (initially hidden)
const surahGrid = document.createElement("div");
surahGrid.hidden = true;
Object.assign(surahGrid.style, {
  flex: "1",
  display: "grid",
  gridTemplateColumns: "repeat(3,1fr)",
  gap: "4px",
  overflowY: "auto",
});
panel.appendChild(surahGrid);

// 6) Juz grid (fills panel on open)
const juzGrid = document.createElement("div");
juzGrid.hidden = false;
Object.assign(juzGrid.style, {
  flex: "1",
  display: "grid",
  gridTemplateColumns: "repeat(6,1fr)",
  gridTemplateRows: "repeat(5,1fr)",
  gap: "2px",
  overflow: "auto",
});
panel.appendChild(juzGrid);

// 7) Load all chapters
let chapters = [];
fetch("https://quranapi.pages.dev/api/surah.json")
  .then((r) => r.json())
  .then((j) => {
    chapters = j;
    loadJuz();
  })
  .catch((e) => console.error("Surah list error:", e));

// 8) Fetch Juz→Surah mappings
const juzMap = {};
let activeJuz = null;
function loadJuz() {
  const calls = Array.from({ length: 30 }, (_, i) => i + 1).map((n) =>
    fetch(`https://api.alquran.cloud/v1/juz/${n}/quran-uthmani`)
      .then((r) => r.json())
      .then((d) => {
        juzMap[n] = d.data.surahs.map((s) => s.number);
      })
      .catch(() => {
        juzMap[n] = [];
      })
  );
  Promise.all(calls).then(renderJuz);
}

// 9) Render the 6×5 Juz buttons
function renderJuz() {
  juzGrid.innerHTML = "";
  for (let i = 1; i <= 30; i++) {
    const b = document.createElement("button");
    b.textContent = i;
    Object.assign(b.style, {
      width: "100%",
      height: "100%",
      border: "none",
      borderRadius: "3px",
      background: activeJuz === i ? "#ccc" : "#eee",
      cursor: "pointer",
      fontSize: "10px",
      lineHeight: "1",
    });
    b.onclick = () => {
      activeJuz = i;
      renderSurahGrid(i);
      header.hidden = false;
      juzGrid.hidden = true;
      surahGrid.hidden = false;
    };
    juzGrid.appendChild(b);
  }
}

// 10) Render Surahs for the selected Juz
function renderSurahGrid(j) {
  chrome.storage.local.get({ surahList: [] }, (d) => {
    const unlocked = new Set(d.surahList.map((s) => s.name));
    surahGrid.innerHTML = "";
    const nums = new Set(juzMap[j] || []);
    chapters.forEach((ch) => {
      if (!nums.has(ch.number)) return;
      const img = document.createElement("img");
      const path =
        quranIcons[ch.surahName] ||
        `icons/suras/${ch.surahName.toLowerCase().replace(/\s+/g, "-")}.png`;
      img.src = chrome.runtime.getURL(path);
      img.title = ch.surahName;
      Object.assign(img.style, {
        width: "32px",
        height: "32px",
        objectFit: "contain",
        filter: unlocked.has(ch.surahName)
          ? "none"
          : "grayscale(100%) opacity(30%)",
        cursor: unlocked.has(ch.surahName) ? "pointer" : "default",
      });
      if (unlocked.has(ch.surahName))
        img.onclick = () => showSurah(ch.surahName);
      surahGrid.appendChild(img);
    });
  });
}

// 11) Overlay + Close button
const overlay = document.createElement("div");
Object.assign(overlay.style, {
  display: "none",
  position: "fixed",
  top: "0",
  left: "0",
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.8)",
  overflowY: "auto",
  padding: "20px",
  zIndex: 999997,
  color: "#222",
});
overlay.innerHTML = `
  <div style="max-width:600px;margin:60px auto;background:#fff;padding:20px;border-radius:8px">
    <div id="surah-content"></div>
    <audio id="surah-audio" controls style="width:100%;margin-top:12px"></audio>
    <button id="ayat-close" style="
      margin-top:16px;width:100%;padding:8px;
      background:#eee;border:none;cursor:pointer;
      border-radius:4px;font-size:16px;
    ">Close</button>
  </div>`;
overlay.querySelector("#ayat-close").onclick = () =>
  (overlay.style.display = "none");
document.body.appendChild(overlay);

// 12) showSurah: fetch & render verse + audio
function showSurah(name) {
  chrome.storage.local.get({ surahList: [] }, (d) => {
    const list = d.surahList;
    const idx = list.findIndex((x) => x.name === name);
    if (idx < 0) return;
    const s = list[idx];
    const render = () => {
      document.getElementById("surah-content").innerHTML = `
        <div style="font-family:sans-serif;color:#111">
          <div style="
            background:#ffff99;padding:8px;
            font-size:1.4em;font-family:'Scheherazade',serif;
            direction:rtl;text-align:right;border-radius:4px
          ">${s.ayah}</div>
          <div style="margin-top:12px;font-style:italic;color:#333">
            ${s.translation}
          </div>
        </div>`;
      const audioEl = document.getElementById("surah-audio");
      audioEl.src = s.audioUrl;
      console.log("Playing:", s.audioUrl);
      overlay.style.display = "block";
    };
    if (!s.audioUrl) {
      fetch(`https://quranapi.pages.dev/v1/verses/${s.number}:1`)
        .then((r) => r.json())
        .then((j) => {
          s.ayah = j.text;
          s.translation = j.translation.en;
          s.audioUrl = j.audio.primary;
          chrome.storage.local.set({ surahList: list }, render);
        })
        .catch((e) => {
          console.error(e);
          render();
        });
    } else {
      render();
    }
  });
}
