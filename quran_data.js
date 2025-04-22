// quran_data.js
// Defines a global quranData map of difficulty → [ { number, name, icon } ]

;(function(glob) {
  glob.quranData = {
    easy: [
      { number: 103, name: "Al-Asr",     icon: "icons/suras/al-asr.png" },
      { number: 114, name: "An-Nas",     icon: "icons/suras/an-nas.png" }
    ],
    medium: [
      { number: 36,  name: "Yasin",      icon: "icons/suras/yasin.png" }
    ],
    hard: [
      { number: 2,   name: "Al-Baqarah", icon: "icons/suras/al-baqarah.png" }
    ]
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
