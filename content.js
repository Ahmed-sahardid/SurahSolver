// content.js

// 1) Poll for “Accepted” and notify background (unchanged)
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

// 2) Toggle button & draggable 150×150 px panel
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

chrome.storage.local.get(["panelLeft", "panelTop"], (d) => {
  if (d.panelLeft && d.panelTop) {
    Object.assign(panel.style, {
      left: d.panelLeft,
      top: d.panelTop,
      right: "auto",
    });
  }
});

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

// 3) Build the 6×5 Juz grid
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

// 4) Overlay for showing a random ayah
const overlay = document.createElement("div");
Object.assign(overlay.style, {
  display: "none",
  position: "fixed",
  top: 0,
  left: 0,
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
    <div id="ayah-text" style="
      font-family:Scheherazade, serif; font-size:1.4em;
      direction:rtl; text-align:right; background:#ffff99;
      padding:8px; border-radius:4px;
    "></div>
    <div id="ayah-trans" style="margin-top:12px;font-style:italic;color:#333"></div>
    <audio id="ayah-audio" controls style="width:100%;margin-top:12px"></audio>
    <button id="ayah-close" style="
      margin-top:16px;width:100%;padding:8px;
      background:#eee;border:none;cursor:pointer;
      border-radius:4px;font-size:16px
    ">Close</button>
  </div>`;
overlay.querySelector("#ayah-close").onclick = () =>
  (overlay.style.display = "none");
document.body.appendChild(overlay);

// 5) Track unlocked Juz in storage
let unlocked = new Set();
chrome.storage.local.get("unlockedJuz", (d) => {
  if (Array.isArray(d.unlockedJuz)) unlocked = new Set(d.unlockedJuz);
  renderJuz();
});

// 6) Render Juz buttons
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
      background: unlocked.has(j) ? "#8f8" : "#eee",
      cursor: "pointer",
      fontSize: "10px",
      lineHeight: "1",
    });
    b.addEventListener("click", () => unlockRandomAyah(j));
    juzGrid.appendChild(b);
  }
}

// 7) On Juz click: fetch one random verse from that Juz :contentReference[oaicite:1]{index=1}
function unlockRandomAyah(j) {
  fetch(
    `https://api.quran.com/api/v4/verses/random?juz_number=${j}&language=en&translations=131&audio=7`
  )
    .then((res) => res.json())
    .then((json) => {
      const v = json.verse;
      // Arabic
      document.getElementById("ayah-text").textContent = v.text_uthmani;
      // Translation
      document.getElementById("ayah-trans").textContent =
        v.translations?.[0]?.text || "";
      // Audio
      const url = v.audio?.url || "";
      document.getElementById("ayah-audio").src = url;

      overlay.style.display = "block";

      // Mark Juz unlocked
      if (!unlocked.has(j)) {
        unlocked.add(j);
        chrome.storage.local.set({ unlockedJuz: [...unlocked] }, renderJuz);
      }
    })
    .catch((err) => console.error("Random ayah error:", err));
}
