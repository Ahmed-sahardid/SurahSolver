// background.js

// Listen for the “PROBLEM_SOLVED” message from content.js
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "PROBLEM_SOLVED") {
    // You can handle difficulty here if needed:
    console.log("Problem solved with difficulty:", msg.difficulty);
    // (Optionally show a notification or badge)
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "Surah Solver",
      message: "You unlocked a new passage!"
    });
  }
});
