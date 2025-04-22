// content.js

// 1) Poll for “Accepted” and notify background
console.log("SurahSolver polling for Accepted");
let triggered = false;
function poll() {
  if (!triggered && document.body.innerText.includes("Accepted")) {
    triggered = true;
    console.log("Accepted detected — sending PROBLEM_SOLVED");
    const diffEl = document.querySelector("[diff]");
    const difficulty = diffEl?.getAttribute("diff").toLowerCase() || "easy";
    chrome.runtime.sendMessage({ type: "PROBLEM_SOLVED", difficulty });
  }
  setTimeout(poll, 2000);
}
poll();

// 2) Floating Dex toggle button
const btn = document.createElement("div");
btn.id = "surah-dex-toggle";
btn.style.cssText = `
  position: fixed; top:10px; right:10px;
  width: 40px; height: 40px;
  background: url(${chrome.runtime.getURL(
    "icons/icon128.png"
  )}) no-repeat center/contain;
  cursor: pointer; z-index: 999999;
`;
document.body.appendChild(btn);

// 3) Build the grid panel
const panel = document.createElement("div");
panel.id = "surah-dex-panel";
panel.style.cssText = `
  position: fixed; top:60px; right:10px;
  width:200px; max-height:80%; overflow-y:auto;
  background: rgba(255,255,255,0.95); padding:10px;
  border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.3);
  display:grid; grid-template-columns:repeat(2,1fr); gap:8px;
  z-index:999998;
`;
document.body.appendChild(panel);

btn.addEventListener("click", () => {
  panel.style.display = panel.style.display === "none" ? "grid" : "none";
});

// 4) Make panel draggable
let isDragging = false,
  offsetX = 0,
  offsetY = 0;
panel.addEventListener("mousedown", (e) => {
  isDragging = true;
  const rect = panel.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", stopDrag);
});
function onDrag(e) {
  if (!isDragging) return;
  panel.style.left = e.clientX - offsetX + "px";
  panel.style.top = e.clientY - offsetY + "px";
  panel.style.right = "auto";
}
function stopDrag() {
  isDragging = false;
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
}

// 5) Populate the grid with icons
chrome.storage.local.get({ surahList: [] }, (data) => {
  const unlocked = new Set(data.surahList.map((s) => s.name));
  [...quranData.easy, ...quranData.medium, ...quranData.hard].forEach((s) => {
    const img = document.createElement("img");
    img.src = chrome.runtime.getURL(s.icon);
    img.title = s.name;
    img.style.cssText = `
      width:48px; height:48px;
      cursor: ${unlocked.has(s.name) ? "pointer" : "default"};
      filter: ${unlocked.has(s.name) ? "none" : "grayscale(100%) opacity(30%)"};
    `;
    if (unlocked.has(s.name)) {
      img.addEventListener("click", () => showSurah(s.name));
    }
    panel.appendChild(img);
  });
});

// 6) Single‑Surah overlay with Close button at bottom
const overlay = document.createElement("div");
overlay.id = "surah-overlay";
overlay.style.cssText = `
  display:none; position:fixed; top:0; left:0;
  width:100%; height:100%; background:rgba(0,0,0,0.8);
  overflow-y:auto; padding:20px; z-index:999997; color:#222;
`;
overlay.innerHTML = `
  <div id="surah-content-wrapper" style="max-width:600px; margin:60px auto; background:#fff; padding:20px; border-radius:8px;">
    <div id="surah-content"></div>
    <audio id="surah-audio" controls style="width:100%; margin-top:12px;"></audio>
    <button id="ayat-close" style="
      margin-top:16px;
      width:100%; padding:8px;
      background:#eee; border:none;
      cursor:pointer; border-radius:4px;
      font-size:16px;
    ">Close</button>
  </div>
`;
document.body.appendChild(overlay);

overlay.querySelector("#ayat-close").addEventListener("click", () => {
  overlay.style.display = "none";
});

// 7) Show a Sūrah’s verse + audio
function showSurah(name) {
  chrome.storage.local.get({ surahList: [] }, (data) => {
    const s = data.surahList.find((x) => x.name === name);
    if (!s) return;
    const content = overlay.querySelector("#surah-content");
    content.innerHTML = `
      <div class="surah-card">
        <div class="arabic">${s.ayah}</div>
        <div class="translation">${s.translation}</div>
      </div>
    `;
    const audioEl = overlay.querySelector("#surah-audio");
    audioEl.src = s.audioUrl;
    overlay.style.display = "block";
  });
}

// 8) Inject card CSS
const css = document.createElement("style");
css.textContent = `
  .surah-card {
    font-family:sans-serif; color:#111;
  }
  .surah-card .arabic {
    background:#ffff99; padding:8px;
    font-size:1.4em; font-family:'Scheherazade',serif;
    direction:rtl; text-align:right; border-radius:4px;
  }
  .surah-card .translation {
    margin-top:12px; font-style:italic; color:#333;
  }
`;
document.head.appendChild(css);
