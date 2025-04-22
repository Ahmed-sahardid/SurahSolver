// background.js
self.importScripts("quran_data.js");

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'PROBLEM_SOLVED') {
    const level = msg.difficulty || 'easy';
    const surah = getRandomSurah(level);

    // Append to our surahList array
    chrome.storage.local.get({ surahList: [] }, data => {
      const updated = data.surahList;
      updated.push(surah);
      chrome.storage.local.set({
        lastSurah: surah,
        surahList: updated
      });
    });

    // Fire the little notification
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: `🎉 You unlocked: ${surah.name}`,
      message: `${surah.ayah}\n${surah.translation}`
    });

    console.log("🔔 Notification sent:", surah);
  }
});

function getRandomSurah(level) {
  const pool = quranData[level] || quranData.easy;
  return pool[Math.floor(Math.random() * pool.length)];
}
