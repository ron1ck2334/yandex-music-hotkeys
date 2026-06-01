// Статус вкладки
chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (resp) => {
  const dot = document.getElementById('status-dot');
  const txt = document.getElementById('status-text');
  if (chrome.runtime.lastError || !resp) {
    txt.textContent = 'Ошибка соединения';
    return;
  }
  if (!resp.found) {
    txt.textContent = 'Вкладка ЯМ не открыта';
  } else {
    dot.classList.add('active');
    txt.textContent = resp.track || 'Яндекс.Музыка открыта';
  }
});

document.getElementById('btn-shortcuts').addEventListener('click', () => {
  chrome.tabs.create({ url: 'brave://extensions/shortcuts' });
});

document.getElementById('btn-open').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://music.yandex.ru' });
});
