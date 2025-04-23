// content.js
;(() => {
  // ── 0) Inject CSS ──────────────────────────────────────────────────────────
  const css = document.createElement("style");
  css.textContent = `
    #ayah-overlay {
      display:none; position:fixed; top:0; left:0;
      width:100%; height:100%;
      background:rgba(0,0,0,0.8);
      overflow-y:auto; padding:20px;
      z-index:999997; color:#222;
    }
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
    .juz-btn {
      width:100%; height:100%; border:none;
      border-radius:3px; background:#fff;
      cursor:pointer; font-size:10px; line-height:1;
    }
    .juz-btn.unlocked {
      background:#f00; color:#fff;
    }
  `;
  document.head.appendChild(css);

  // ── 1) Preload chapter names ──────────────────────────────────────────────
  let chapters = [];
  fetch("https://api.quran.com/api/v4/chapters?language=en")
    .then(r => r.json())
    .then(j => chapters = j.chapters)
    .catch(console.error);

  // ── 2) Preload Juz → [ { surah, ayah } ] lists ─────────────────────────
  const juzMap = {};
  Promise.all(
    Array.from({length:30}, (_,i) => i+1).map(j =>
      fetch(`https://api.alquran.cloud/v1/juz/${j}/quran-uthmani`)
        .then(r => r.json())
        .then(jd => {
          juzMap[j] = jd.data.ayahs.map(v => ({
            surah: v.surah.number,
            ayah:  v.numberInSurah
          }));
        })
        .catch(_ => { juzMap[j]=[]; })
    )
  ).then(renderGrid);

  // ── 3) Create & drag-make the toggle icon (hidden) ───────────────────────
  const icon = document.createElement("div");
  Object.assign(icon.style, {
    position:"fixed", top:"10px", right:"10px",
    width:"40px", height:"40px",
    background:`url(${chrome.runtime.getURL("icons/icon128.png")}) center/contain no-repeat`,
    cursor:"pointer", zIndex:999999, display:"none"
  });
  document.body.appendChild(icon);

  chrome.storage.local.get(["iconLeft","iconTop"], d => {
    if (d.iconLeft && d.iconTop) {
      Object.assign(icon.style,{ left:d.iconLeft, top:d.iconTop, right:"auto" });
    }
  });

  let draggingIcon=false, ix=0, iy=0;
  icon.addEventListener("mousedown", e => {
    draggingIcon=true;
    const r=icon.getBoundingClientRect();
    ix=e.clientX - r.left; iy=e.clientY - r.top;
    document.addEventListener("mousemove", moveIcon);
    document.addEventListener("mouseup", upIcon);
  });
  function moveIcon(e) {
    if(!draggingIcon) return;
    icon.style.left=(e.clientX-ix)+"px";
    icon.style.top =(e.clientY-iy)+"px";
    icon.style.right="auto";
  }
  function upIcon() {
    draggingIcon=false;
    document.removeEventListener("mousemove", moveIcon);
    document.removeEventListener("mouseup", upIcon);
    chrome.storage.local.set({ iconLeft:icon.style.left, iconTop:icon.style.top });
  }

  // ── 4) Create & drag-make the panel (hidden) ────────────────────────────
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

  icon.addEventListener("click", ()=> {
    panel.style.display = panel.style.display==="none" ? "flex" : "none";
  });

  chrome.storage.local.get(["panelLeft","panelTop"], d => {
    if(d.panelLeft&&d.panelTop){
      Object.assign(panel.style,{ left:d.panelLeft, top:d.panelTop, right:"auto" });
    }
  });

  let draggingPanel=false, px=0, py=0;
  panel.addEventListener("mousedown", e => {
    draggingPanel=true;
    const r=panel.getBoundingClientRect();
    px=e.clientX - r.left; py=e.clientY - r.top;
    document.addEventListener("mousemove", movePanel);
    document.addEventListener("mouseup", upPanel);
  });
  function movePanel(e) {
    if(!draggingPanel) return;
    panel.style.left=(e.clientX-px)+"px";
    panel.style.top =(e.clientY-py)+"px";
    panel.style.right="auto";
  }
  function upPanel() {
    draggingPanel=false;
    document.removeEventListener("mousemove", movePanel);
    document.removeEventListener("mouseup", upPanel);
    chrome.storage.local.set({ panelLeft:panel.style.left, panelTop:panel.style.top });
  }

  // ── 5) Build the 6×5 grid container ─────────────────────────────────────
  const grid = document.createElement("div");
  Object.assign(grid.style,{
    flex:1, display:"grid",
    gridTemplateColumns:"repeat(6,1fr)",
    gridTemplateRows:"repeat(5,1fr)",
    gap:"2px", overflow:"auto"
  });
  panel.appendChild(grid);

  // ── 6) Overlay for verse display ────────────────────────────────────────
  const overlay = document.createElement("div");
  overlay.id="ayah-overlay";
  overlay.innerHTML=`
    <div class="content">
      <div id="ayah-header"></div>
      <div id="ayah-text"></div>
      <div id="ayah-trans"></div>
      <audio id="ayah-audio" controls></audio>
      <button id="ayah-close">Close</button>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector("#ayah-close").onclick = () => overlay.style.display="none";

  // ── 7) Track unlocked Juz in memory ────────────────────────────────────
  let unlocked = new Set();

  // ── 8) Render grid (white → red for unlocked) ─────────────────────────
  function renderGrid(){
    grid.innerHTML = "";
    for(let j=1;j<=30;j++){
      const b=document.createElement("button");
      b.textContent = j;
      b.className = "juz-btn" + (unlocked.has(j)?" unlocked":"");
      b.onclick = ()=> unlockAyah(j); // manual fallback
      grid.appendChild(b);
    }
  }

  // This may run before juzMap is ready; that's fine—render white first.
  renderGrid();

  // ── 9) Poll LeetCode for “Accepted” → reveal UI & pick random Juz ────
  let triggered=false;
  const check = setInterval(()=>{
    if(!triggered && document.body.innerText.includes("Accepted")){
      triggered=true;
      clearInterval(check);
      icon.style.display  = "block";
      panel.style.display = "flex";
      const rJ = Math.floor(Math.random()*30)+1;
      unlockAyah(rJ);
    }
  },1000);

  // ── 10) unlockAyah(j): pick random verse → fetch with AlQuran.Cloud ──
  function unlockAyah(j){
    const list = juzMap[j]||[];
    if(!list.length) return;
    // pick one at random
    const {surah:s,ayah:a} = list[Math.floor(Math.random()*list.length)];
    const chap = chapters.find(c=>c.id===s)||{};
    // fetch Arabic, audio (Alafasy), translation (Asad)
    fetch(`https://api.alquran.cloud/v1/ayah/${s}:${a}/editions/quran-uthmani,ar.alafasy,en.asad`)
      .then(r=>r.json())
      .then(json=>{
        const [arObj, audObj, trObj] = json.data;
        document.getElementById("ayah-header").innerHTML =
          `Juz ${j} — <span class="surah">${chap.name_arabic} / ${chap.name_complex}</span> — Ayah ${a}`;
        document.getElementById("ayah-text").textContent = arObj.text;
        document.getElementById("ayah-trans").textContent = trObj.text;
        document.getElementById("ayah-audio").src = audObj.audio;
        overlay.style.display = "block";
        if(!unlocked.has(j)){
          unlocked.add(j);
          renderGrid();
        }
      })
      .catch(console.error);
  }
})();
