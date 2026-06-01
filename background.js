// background.js — перехватывает горячие клавиши и отправляет команды на вкладку ЯМ

chrome.commands.onCommand.addListener(async (command) => {
  const tab = await findYandexMusicTab();
  if (!tab) {
    // Если вкладки нет — показываем badge с предупреждением
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF5A3B' });
    setTimeout(() => chrome.action.setBadgeText({ text: '' }), 2000);
    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, { action: command });
  } catch (e) {
    // Content script ещё не готов — инжектируем и повторяем
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    setTimeout(() => {
      chrome.tabs.sendMessage(tab.id, { action: command });
    }, 300);
  }
});

async function findYandexMusicTab() {
  const tabs = await chrome.tabs.query({});
  return tabs.find(t =>
    t.url && (t.url.includes('music.yandex.ru') || t.url.includes('music.yandex.com'))
  ) || null;
}

// Сообщение от popup — получить текущий статус
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATUS') {
    findYandexMusicTab().then(tab => {
      if (!tab) {
        sendResponse({ found: false });
        return;
      }
      chrome.tabs.sendMessage(tab.id, { action: 'get-status' }, (resp) => {
        sendResponse({ found: true, ...resp });
      });
    });
    return true; // async
  }
});
