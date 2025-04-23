// content.js

// 0) Inject CSS for overlay header, Arabic, translation, audio, and close button
const css = document.createElement("style");
css.textContent = `
  /* Overlay backdrop */
  #ayah-overlay {
    display: none;
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.8);
    overflow-y: auto;
    padding: 20px;
    z-index: 999997;
    color: #222;
  }
  /* Inner content box */
  #ayah-overlay .content {
    max-width: 600px;
    margin: 60px auto;
    background: #fff;
    padding: 20px;
    border-radius: 8px;
  }
  /* Header: “Juz X — SurahArabic / SurahEnglish — Ayah Y” */
  #ayah-header {
    text-align: center;
    font-weight: bold;
    margin-bottom: 8px;
    font-size: 14px;
  }
  /* Arabic ayah text */
  #ayah-text {
    font-family: 'Scheherazade', serif;
    font-size: 1.4em;
    direction: rtl;
    text-align: right;
    background: #ffff99;
    padding: 8px;
    border-radius: 4px;
  }
  /* English translation */
  #ayah-trans {
    margin-top: 12px;
    font-style: italic;
    color: #333;
    font-size: 1em;
  }
  /* Audio player */
  #ayah-audio {
    width: 100%;
    margin-top: 12px;
  }
  /* Close button */
  #ayah-close {
    margin-top: 16px;
    width: 100%;
    padding: 8px;
    background: #eee;
    border: none;
    cursor: pointer;
    border-radius: 4px;
    font-size: 16px;
  }
`;
document.head.appendChild(css);

// 1) Pre-load chapter names for lookup
let chaptersList = [];
fetch("https://api.quran.com/api/v4/chapters?language=en")
  .then((r) => r.json())
  .then((json) => {
    chaptersList = json.chapters;
  })
  .catch((err) => console.error("Chapters fetch error:", err));

// 2) Poll for “Accepted” → trigger random Juz unlock
let triggered = false;
function poll() {
  if (!triggered && document.body.innerText.includes("Accepted")) {
    triggered = true;
    // notify background (optional)
    const diff =
      document.querySelector("[diff]")?.getAttribute("diff")?.toLowerCase() ||
      "easy";
    chrome.runtime.sendMessage({ type: "PROBLEM_SOLVED", difficulty: diff });
    // pick a random Juz 1–30 and unlock it
    const randomJ = Math.floor(Math.random() * 30) + 1;
    unlockRandomAyah(randomJ);
  }
  setTimeout(poll, 2000);
}
poll();

// 3) Toggle button & draggable 150×150px panel
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
document.body.appendChild(btn);

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

btn.onclick = () => {
  panel.style.display = panel.style.display === "none" ? "flex" : "none";
};

// restore panel position
chrome.storage.local.get(["panelLeft", "panelTop"], (d) => {
  if (d.panelLeft && d.panelTop) {
    Object.assign(panel.style, {
      left: d.panelLeft,
      top: d.panelTop,
      right: "auto",
    });
  }
});

// make panel draggable & persist position
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

// 4) Build the 6×5 Juz grid inside the panel
const juzGrid = document.createElement("div");
Object.assign(juzGrid.style, {
  flex: "1",
  display: "grid",
  gridTemplateColumns: "repeat(6,1fr)",
  gridTemplateRows: "repeat(5,1fr)",
  gap: "2px",
  overflow: "auto",
});
panel.appendChild(juzGrid);

// 5) Create overlay for verse display
const overlay = document.createElement("div");
overlay.id = "ayah-overlay";
overlay.innerHTML = `
  <div class="content">
    <div id="ayah-header"></div>
    <div id="ayah-text"></div>
    <div id="ayah-trans"></div>
    <audio id="ayah-audio" controls></audio>
    <button id="ayah-close">Close</button>
  </div>
`;
document.body.appendChild(overlay);
overlay.querySelector("#ayah-close").onclick = () =>
  (overlay.style.display = "none");

// 6) Track which Juz have been unlocked
let unlocked = new Set();
chrome.storage.local.get("unlockedJuz", (d) => {
  if (Array.isArray(d.unlockedJuz)) unlocked = new Set(d.unlockedJuz);
  renderJuz();
});

// 7) Render the Juz buttons, coloring unlocked ones red
function renderJuz() {
  juzGrid.innerHTML = "";
  for (let j = 1; j <= 30; j++) {
    const b = document.createElement("button");
    b.textContent = j;
    Object.assign(b.style, {
      width: "100%",
      height: "100%",
      border: "none",
      borderRadius: "3px",
      background: unlocked.has(j) ? "#f88" : "#eee",
      cursor: "pointer",
      fontSize: "10px",
      lineHeight: "1",
    });
    // manual click still works
    b.onclick = () => unlockRandomAyah(j);
    juzGrid.appendChild(b);
  }
}

// 8) Fetch & display one random ayah from the given Juz
function unlockRandomAyah(j) {
  fetch(
    `https://api.quran.com/api/v4/verses/random?juz_number=${j}` +
      `&language=en&translations=20&audio=7`
  )
    .then((res) => res.json())
    .then((json) => {
      const v = json.verse;
      const [sNum, aNum] = v.verse_key.split(":").map(Number);
      const chap = chaptersList.find((c) => c.id === sNum) || {};

      // set header: “Juz j — SurahArabic / SurahEnglish — Ayah aNum”
      document.getElementById(
        "ayah-header"
      ).textContent = `Juz ${j} — ${chap.name_arabic} / ${chap.name_complex} — Ayah ${aNum}`;

      // Arabic and English text
      document.getElementById("ayah-text").textContent = v.text_uthmani;
      document.getElementById("ayah-trans").textContent =
        v.translations?.[0]?.text || "";

      // audio
      document.getElementById("ayah-audio").src = v.audio?.url || "";

      overlay.style.display = "block";

      // mark as unlocked and recolor button
      if (!unlocked.has(j)) {
        unlocked.add(j);
        chrome.storage.local.set({ unlockedJuz: [...unlocked] }, renderJuz);
      }
    })
    .catch((err) => console.error("Random ayah error:", err));
}
