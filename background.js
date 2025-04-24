// background.js

// Toggle panel when the extension icon is clicked
chrome.action.onClicked.addListener(tab => {
  chrome.tabs.sendMessage(tab.id, { action: "showPanel" });
});

// When an alarm fires, broadcast to all web tabs
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'showPanel') {
    chrome.tabs.query({}, tabs => {
      for (let t of tabs) {
        if (t.id && t.url && (t.url.startsWith('http://') || t.url.startsWith('https://'))) {
          chrome.tabs.sendMessage(t.id, { action: 'showPanel' });
        }
      }
    });
  }
});
