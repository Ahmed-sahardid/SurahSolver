// background.js

let openTabId = null;

// Toolbar icon click ➡ toggle exclusive panel
chrome.action.onClicked.addListener(tab => {
  const newId = tab.id;
  // close previous if different
  if (openTabId !== null && openTabId !== newId) {
    chrome.tabs.sendMessage(openTabId, { action: 'closePanel' });
  }
  // if same tab, just close
  if (openTabId === newId) {
    chrome.tabs.sendMessage(newId, { action: 'closePanel' });
    openTabId = null;
  } else {
    // open in this tab
    chrome.tabs.sendMessage(newId, { action: 'showPanel' });
    openTabId = newId;
  }
  chrome.storage.local.set({ openTabId });
});

// Listen for explicit panelClosed from content to clear our record
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.action === 'panelClosed' && sender.tab && sender.tab.id === openTabId) {
    openTabId = null;
    chrome.storage.local.remove('openTabId');
  }
});

// Alarm fires ➡ open in active tab (closing any other)
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'showPanel') {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
      if (!tabs[0] || !tabs[0].id) return;
      const newId = tabs[0].id;
      if (openTabId !== null && openTabId !== newId) {
        chrome.tabs.sendMessage(openTabId, { action: 'closePanel' });
      }
      chrome.tabs.sendMessage(newId, { action: 'showPanel' });
      openTabId = newId;
      chrome.storage.local.set({ openTabId });
    });
  }
});
