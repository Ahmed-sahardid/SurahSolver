chrome.storage.local.get("lastSurah", (data) => {
  const surah = data.lastSurah;
  const container = document.getElementById("surah-info");

  if (surah) {
    container.innerHTML = `
      <strong>${surah.name}</strong><br/>
      <em>${surah.ayah}</em><br/>
      <p>${surah.translation}</p>
    `;
  } else {
    container.textContent = "Solve a LeetCode to get started!";
  }
});

// Add manual test trigger
document.body.addEventListener("click", () => {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "../icons/icon128.png",
    title: "Test Notification",
    message: "This means SurahSolver is working!"
  });
});
