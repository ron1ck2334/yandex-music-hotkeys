// background.js

chrome.commands.onCommand.addListener(async (command) => {
  const tabs = await chrome.tabs.query({});
  const tab = tabs.find(t => t.url && (
    t.url.includes('music.yandex.ru') || t.url.includes('music.yandex.com')
  ));

  if (!tab) {
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF5A3B' });
    setTimeout(() => chrome.action.setBadgeText({ text: '' }), 2000);
    return;
  }

  chrome.tabs.sendMessage(tab.id, { action: command });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATUS') {
    chrome.tabs.query({}, (tabs) => {
      const tab = tabs.find(t => t.url && (
        t.url.includes('music.yandex.ru') || t.url.includes('music.yandex.com')
      ));
      if (!tab) { sendResponse({ found: false }); return; }
      chrome.tabs.sendMessage(tab.id, { action: 'get-status' }, (resp) => {
        sendResponse({ found: true, ...resp });
      });
    });
    return true;
  }
});
