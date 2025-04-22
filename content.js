let lastCheck = "";

setInterval(() => {
  const banner = document.querySelector('[data-cy="submission-result"]');
  if (banner && banner.textContent.includes("Accepted") && banner.textContent !== lastCheck) {
    lastCheck = banner.textContent;

    const difficultyLabel = document.querySelector('[diff]');
    let difficulty = 'easy';
    if (difficultyLabel) {
      difficulty = difficultyLabel.getAttribute('diff').toLowerCase();
    }

    chrome.runtime.sendMessage({
      type: "PROBLEM_SOLVED",
      difficulty
    });
  }
}, 3000);
