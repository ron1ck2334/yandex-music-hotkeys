(function () {
  if (window.__ymHotkeysLoaded) return;
  window.__ymHotkeysLoaded = true;

  function findByAriaLabel(labels) {
    for (const btn of document.querySelectorAll('button')) {
      const label = btn.getAttribute('aria-label') || '';
      if (labels.some(l => label.includes(l))) return btn;
    }
    return null;
  }

  function clickPlay() {
    const btn = findByAriaLabel(['Воспроизведение', 'Пауза', 'Play', 'Pause']);
    if (btn) { btn.click(); showToast('▶/⏸'); }
    else showToast('Кнопка не найдена');
  }

  function clickNext() {
    const btn = findByAriaLabel(['Следующая песня', 'Следующий', 'Next']);
    if (btn) { btn.click(); showToast('⏭ Следующий'); }
    else showToast('Кнопка не найдена');
  }

  function clickPrev() {
    const btn = findByAriaLabel(['Предыдущая песня', 'Предыдущий', 'Prev']);
    if (btn) { btn.click(); showToast('⏮ Предыдущий'); }
    else showToast('Кнопка не найдена');
  }

  function changeVolume(direction) {
    // Ищем слайдер громкости рядом с кнопкой "Настройки звука"
    const volumeBtn = findByAriaLabel(['Настройки звука', 'Выключить звук', 'Включить звук', 'громкост']);
    
    // Пробуем найти input[range] в родительском контейнере кнопки звука
    let slider = null;
    if (volumeBtn) {
      const container = volumeBtn.closest('[class*="volume"], [class*="Volume"], [class*="sound"], [class*="Sound"]')
                     || volumeBtn.parentElement?.parentElement;
      if (container) slider = container.querySelector('input[type="range"]');
    }
    if (!slider) slider = document.querySelector('input[type="range"]');

    if (slider) {
      const current = parseFloat(slider.value);
      const max = parseFloat(slider.max || 100);
      const min = parseFloat(slider.min || 0);
      const step = (max - min) * 0.1;
      const newVal = Math.max(min, Math.min(max, current + direction * step));

      // Меняем значение через нативный setter (работает с React)
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(slider, newVal);
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));

      const pct = Math.round((newVal / max) * 100);
      showToast(direction > 0 ? `🔊 ${pct}%` : `🔉 ${pct}%`);
    } else {
      showToast('Слайдер громкости не найден');
    }
  }

  // ─── Тост ─────────────────────────────────────────────────────────────────
  let toastEl = null, toastTimer = null;

  function showToast(text) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      Object.assign(toastEl.style, {
        position: 'fixed', bottom: '24px', right: '24px',
        background: 'rgba(20,20,20,0.92)', color: '#fff',
        padding: '9px 16px', borderRadius: '10px',
        fontSize: '14px', fontFamily: 'system-ui, sans-serif',
        zIndex: '2147483647', pointerEvents: 'none',
        transition: 'opacity 0.2s', opacity: '0',
        backdropFilter: 'blur(8px)', boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
      });
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = text;
    toastEl.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.style.opacity = '0'; }, 1600);
  }

  // ─── Обработчик ───────────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case 'play-pause':  clickPlay(); break;
      case 'next-track':  clickNext(); break;
      case 'prev-track':  clickPrev(); break;
      case 'volume-up':   changeVolume(+1); break;
      case 'volume-down': changeVolume(-1); break;
      case 'get-status': {
        const slider = document.querySelector('input[type="range"]');
        const vol = slider ? Math.round((parseFloat(slider.value) / parseFloat(slider.max || 100)) * 100) : null;
        sendResponse({ volume: vol });
        return;
      }
    }
  });

  console.log('[ЯМ Хоткеи] загружен');
})();
