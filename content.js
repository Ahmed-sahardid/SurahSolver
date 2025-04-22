console.log("👀 SurahSolver content script loaded.");

let lastSeen = "";

setInterval(() => {
  const banner = document.querySelector('[data-cy="submission-result"]');
  if (banner) {
    console.log("📦 Submission result detected:", banner.textContent);
  }

  if (banner && banner.textContent.includes("Accepted") && banner.textContent !== lastSeen) {
    lastSeen = banner.textContent;
    console.log("✅ Problem accepted! Triggering SurahSolver.");

    const difficultyLabel = document.querySelector('[diff]');
    const difficulty = difficultyLabel ? difficultyLabel.getAttribute('diff').toLowerCase() : 'easy';

    chrome.runtime.sendMessage({
      type: "PROBLEM_SOLVED",
      difficulty: difficulty
    });
  }
}, 3000);
