// background.js
importScripts("quran_data.js");

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== "PROBLEM_SOLVED") return;

  const level = msg.difficulty || "easy";

  chrome.storage.local.get({ surahList: [] }, (data) => {
    const unlockedNames = data.surahList.map((s) => s.name);
    const pool = quranData[level] || quranData.easy;

    // pick a new one if possible
    const remaining = pool.filter((s) => !unlockedNames.includes(s.name));
    const choice = remaining.length
      ? remaining[Math.floor(Math.random() * remaining.length)]
      : pool[Math.floor(Math.random() * pool.length)];

    const { number, name, icon } = choice;
    const ayahNumber = 1;

    fetch(`https://quranapi.pages.dev/v1/verses/${number}:${ayahNumber}`)
      .then((res) => res.json())
      .then((json) => {
        const ayahText = json.text;
        const translation = json.translation.en;
        const audioUrl = json.audio.primary; // audio URL

        const unlockedSurah = {
          number,
          name,
          icon,
          ayah: ayahText,
          translation,
          audioUrl,
        };

        if (!unlockedNames.includes(name)) {
          data.surahList.push(unlockedSurah);
        }

        chrome.storage.local.set(
          {
            surahList: data.surahList,
            lastSurah: unlockedSurah,
          },
          () => {
            chrome.notifications.create({
              type: "basic",
              iconUrl: "icons/icon128.png",
              title: `You unlocked: ${name}`,
              message: `${ayahText}\n\n${translation}`,
            });
          }
        );
      })
      .catch((err) => console.error("SurahSolver fetch error", err));
  });
});
