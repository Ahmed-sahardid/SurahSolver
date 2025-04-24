// prayer.js

function format12Hour(time24) {
      const [h24, m] = time24.split(':').map(Number);
      const suffix = h24 >= 12 ? 'PM' : 'AM';
      const h12 = ((h24 + 11) % 12) + 1;
      return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
    }
    
    function getPrayerTimes(lat, lon) {
      // insert into the ".qs-console" container
      const consoleEl = document.querySelector('.qs-console');
    
      fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=2`)
        .then(r => r.json())
        .then(data => {
          const t = data.data.timings;
          consoleEl.innerHTML = `
            <div style="
              color:#ffeb3b;
              font-size:14px;
              line-height:1.4;
              text-align:left;
              padding:8px;
            ">
              <div id="location-label" style="font-weight:bold; margin-bottom:8px;">
                📍 Locating...
              </div>
              <strong>Prayer Times</strong><br>
              Fajr: ${format12Hour(t.Fajr)}<br>
              Dhuhr: ${format12Hour(t.Dhuhr)}<br>
              Asr: ${format12Hour(t.Asr)}<br>
              Maghrib: ${format12Hour(t.Maghrib)}<br>
              Isha: ${format12Hour(t.Isha)}
            </div>`;
        })
        .catch(() => {
          consoleEl.innerText = 'Could not load prayer times.';
        });
    
      // reverse‐geocode
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
        .then(r => r.json())
        .then(loc => {
          const city    = loc.address.city    || loc.address.town || loc.address.village || '';
          const country = loc.address.country || '';
          const label   = city ? `${city}, ${country}` : country;
          const lblEl   = document.getElementById('location-label');
          if (lblEl) lblEl.innerText = `📍 ${label}`;
        })
        .catch(() => {});
    }
    