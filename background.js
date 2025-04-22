// background.js
importScripts("quran_data.js");

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== "PROBLEM_SOLVED") return;

  const level = msg.difficulty || "easy";

  chrome.storage.local.get({ surahList: [] }, (data) => {
    const unlockedNames = data.surahList.map((s) => s.name);
    const pool = quranData[level] || quranData.easy;

    const remaining = pool.filter((s) => !unlockedNames.includes(s.name));
    const choice = remaining.length
      ? remaining[Math.floor(Math.random() * remaining.length)]
      : pool[Math.floor(Math.random() * pool.length)];

    const { number, name, icon } = choice;
    const ayahNumber = 1;

    // 1) fetch the verse text + translation
    fetch(`https://quranapi.pages.dev/v1/verses/${number}:${ayahNumber}`)
      .then((res) => res.json())
      .then((verseJson) => {
        const ayahText = verseJson.text;
        const translation = verseJson.translation.en;

        // 2) fetch the audio URLs for the chapter
        return fetch(`https://quranapi.pages.dev/api/audio/${number}.json`)
          .then((res) => res.json())
          .then((audioJson) => {
            // pick reciter #1 by default
            const audioUrl = audioJson["1"]?.url;

            const unlockedSurah = {
              number,
              name,
              icon,
              ayah: ayahText,
              translation,
              audioUrl,
            };

            // 3) add it if new
            if (!unlockedNames.includes(name)) {
              data.surahList.push(unlockedSurah);
            }

            // 4) save & notify
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
          });
      })
      .catch((err) => console.error("SurahSolver fetch error", err));
  });
});
