self.importScripts("quran_data.js");

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'PROBLEM_SOLVED') {
    const level = msg.difficulty || 'easy';
    const surah = getRandomSurah(level);

    chrome.storage.local.set({ lastSurah: surah });

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: `🎉 LeetCode Solved!`,
      message: `Surah: ${surah.name}\nAyah: ${surah.ayah}\nMeaning: ${surah.translation}`
    });

    console.log("🔔 Notification sent:", surah);
  }
});

function getRandomSurah(level) {
  const pool = quranData[level] || quranData.easy;
  return pool[Math.floor(Math.random() * pool.length)];
}

