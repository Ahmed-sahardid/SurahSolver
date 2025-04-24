// countdown.js

const arabicDigits = {
      '0':'٠','1':'١','2':'٢','3':'٣','4':'٤',
      '5':'٥','6':'٦','7':'٧','8':'٨','9':'٩'
    };
    
    function toArabic(num) {
      return String(num)
        .split('')
        .map(d => arabicDigits[d] || d)
        .join('');
    }
    
    function startCountdown(seconds) {
      let rem = seconds;
      const cd = document.createElement("div");
      cd.id = "qs-countdown";
      cd.innerHTML = `
        <div class="countdown-arabic">${toArabic(rem)}</div>
        <div class="countdown-numeric">${rem}</div>`;
      document.body.appendChild(cd);
    
      const iv = setInterval(() => {
        rem--;
        if (rem <= 0) {
          clearInterval(iv);
          cd.remove();
          // when done, show a random Ayah
          if (typeof showRandomAyah === 'function') showRandomAyah();
        } else {
          cd.querySelector(".countdown-arabic").textContent = toArabic(rem);
          cd.querySelector(".countdown-numeric").textContent = rem;
        }
      }, 1000);
    }
    