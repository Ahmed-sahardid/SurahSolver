// content.js
console.log("👀 SurahSolver script loaded and polling page text for 'Accepted'...");

let triggered = false;

function pollForAccepted() {
  const bodyText = document.body.innerText;
  if (!triggered && bodyText.includes("Accepted")) {
    triggered = true;
    console.log("✅ Found “Accepted” in page text — triggering SurahSolver");

    // detect difficulty (same as before)
    const diffEl = document.querySelector('[diff]');
    const difficulty = diffEl
      ? diffEl.getAttribute('diff').toLowerCase()
      : 'easy';

    chrome.runtime.sendMessage({
      type: "PROBLEM_SOLVED",
      difficulty
    });
  }
  setTimeout(pollForAccepted, 2000);
}

pollForAccepted();
