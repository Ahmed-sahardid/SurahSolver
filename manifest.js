{
      "manifest_version": 3,
      "name": "Surah Solver/",
      "version": "1.1",
      "description": "Solve a LeetCode problem → unlock a Sūrah verse via a timer",
      "permissions": [
        "storage"
      ],
      "host_permissions": [
        "https://leetcode.com/*",
        "https://api.quran.com/*",
        "https://api.alquran.cloud/*",
        "https://cdn.islamic.network/*"
      ],
      "content_scripts": [
        {
          "matches": ["https://leetcode.com/*"],
          "js": ["content.js"]
        }
      ]
    }