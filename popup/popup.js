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
    