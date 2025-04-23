chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'startTimer') {
    const when = Date.now() + msg.durationMs;
    chrome.storage.local.set({ expiration: when });
    chrome.alarms.create('showPanel', { when });
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'showPanel') {
    // Broadcast to every LeetCode tab
    chrome.tabs.query({ url: 'https://leetcode.com/*' }, (tabs) => {
      for (let tab of tabs) {
        chrome.tabs.sendMessage(tab.id, { action: 'showPanel' });
      }
    });
  }
});
