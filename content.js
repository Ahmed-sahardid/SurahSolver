// 1) Poll for “Accepted” and notify background
console.log("👀 SurahSolver polling for Accepted…");
let triggered = false;
function poll() {
  if (!triggered && document.body.innerText.includes("Accepted")) {
    triggered = true;
    console.log("✅ Accepted detected — sending PROBLEM_SOLVED");
    const diffEl = document.querySelector('[diff]');
    const difficulty = diffEl?.getAttribute('diff').toLowerCase() || 'easy';
    chrome.runtime.sendMessage({ type: "PROBLEM_SOLVED", difficulty });
  }
  setTimeout(poll, 2000);
}
poll();

// 2) Floating “Poke‑dex” toggle button
const btn = document.createElement('div');
btn.id = 'surah-dex-toggle';
btn.style.cssText = `
  position: fixed; top: 10px; right: 10px;
  width: 40px; height: 40px;
  background: url(${chrome.runtime.getURL('icons/icon128.png')})
              no-repeat center/contain;
  cursor: pointer; z-index: 999999;
`;
document.body.appendChild(btn);
btn.addEventListener('click', () => {
  panel.style.display = panel.style.display === 'none' ? 'grid' : 'none';
});

// 3) Build the grid panel of all Sūrah icons
const panel = document.createElement('div');
panel.id = 'surah-dex-panel';
panel.style.cssText = `
  display: none;
  position: fixed;
  top: 60px; right: 10px;
  width: 200px;
  max-height: 80%;
  overflow-y: auto;
  background: rgba(255,255,255,0.95);
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  z-index: 999998;
  display: grid;
`;
document.body.appendChild(panel);

// Flatten all surahs and populate panel
const allSurahs = [
  ...quranData.easy,
  ...quranData.medium,
  ...quranData.hard
];
chrome.storage.local.get({ surahList: [] }, data => {
  const unlocked = data.surahList.map(s => s.name);
  allSurahs.forEach(s => {
    const img = document.createElement('img');
    img.src = chrome.runtime.getURL(s.icon);
    img.title = s.name;
    img.style.cssText = `
      width: 48px; height: 48px;
      cursor: ${unlocked.includes(s.name) ? 'pointer' : 'default'};
      filter: ${unlocked.includes(s.name)
                ? 'none'
                : 'grayscale(100%) opacity(30%)'};
    `;
    if (unlocked.includes(s.name)) {
      img.addEventListener('click', () => showSurah(s));
    }
    panel.appendChild(img);
  });
});

// 4) Single‑Surah overlay
const overlay = document.createElement('div');
overlay.id = 'surah-overlay';
overlay.style.cssText = `
  display: none;
  position: fixed; top:0; left:0;
  width:100%; height:100%;
  background:rgba(0,0,0,0.8);
  overflow-y:auto; padding:20px;
  z-index:999997; color:#222;
`;
overlay.innerHTML = `
  <button id="surah-close">Close</button>
  <div id="surah-content" style="max-width:600px; margin:40px auto;"></div>
`;
document.body.appendChild(overlay);
overlay.querySelector('#surah-close').onclick = () => {
  overlay.style.display = 'none';
};

// 5) Show a single Sūrah card
function showSurah(s) {
  const c = overlay.querySelector('#surah-content');
  c.innerHTML = `
    <div class="surah-card">
      <div class="arabic">${s.ayah}</div>
      <div class="translation">${s.translation}</div>
    </div>
  `;
  overlay.style.display = 'block';
}

// 6) Inject card & panel styles
const css = document.createElement('style');
css.textContent = `
  #surah-close {
    position:absolute; top:15px; right:20px;
    padding:5px 10px; font-size:14px;
  }
  .surah-card {
    background:#fff; border-radius:8px;
    padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.3);
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
