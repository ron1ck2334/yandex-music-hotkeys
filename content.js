// content.js — инжектируется на страницу ЯМ, управляет плеером через DOM

(function () {
  // Предотвращаем двойную инициализацию
  if (window.__ymHotkeysLoaded) return;
  window.__ymHotkeysLoaded = true;

  // ─── Селекторы кнопок плеера ───────────────────────────────────────────────
  // Яндекс иногда меняет классы — здесь несколько вариантов для надёжности
  const SELECTORS = {
    playPause: [
      '.player-controls__btn_play',
      '[class*="PlayerControls_buttonPlay"]',
      '[class*="player-controls__play"]',
      'button[aria-label*="пауз"]',
      'button[aria-label*="play"]',
      'button[aria-label*="Воспроизвести"]',
      'button[aria-label*="Пауза"]',
    ],
    next: [
      '.player-controls__btn_next',
      '[class*="PlayerControls_buttonNext"]',
      '[class*="player-controls__next"]',
      'button[aria-label*="ледующ"]',
      'button[aria-label*="next"]',
    ],
    prev: [
      '.player-controls__btn_prev',
      '[class*="PlayerControls_buttonPrev"]',
      '[class*="player-controls__prev"]',
      'button[aria-label*="редыдущ"]',
      'button[aria-label*="prev"]',
    ],
    like: [
      '[class*="TrackControls_buttonLike"]',
      '.track__btn_like',
      'button[aria-label*="айк"]',
      'button[aria-label*="like"]',
    ],
    // Слайдер громкости — используем его value напрямую
    volumeSlider: [
      'input[class*="volume"]',
      'input[aria-label*="ромкость"]',
      'input[aria-label*="olume"]',
      '.volume__slider input',
    ],
  };

  function findElement(selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  // ─── Изменение громкости через React/Vue state ────────────────────────────
  function setVolumeSlider(slider, value) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    ).set;
    nativeInputValueSetter.call(slider, value);
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function changeVolume(delta) {
    const slider = findElement(SELECTORS.volumeSlider);
    if (!slider) {
      showToast('Слайдер громкости не найден');
      return;
    }
    const current = parseInt(slider.value, 10);
    const max = parseInt(slider.max || 100, 10);
    const min = parseInt(slider.min || 0, 10);
    const step = Math.round((max - min) * 0.1); // шаг 10%
    const newVal = Math.max(min, Math.min(max, current + delta * step));
    setVolumeSlider(slider, newVal);
    const pct = Math.round((newVal / max) * 100);
    showToast(`Громкость: ${pct}%`, delta > 0 ? '🔊' : '🔉');
  }

  // ─── Тост-уведомление (минималистичное) ──────────────────────────────────
  let toastEl = null;
  let toastTimer = null;

  function showToast(text, icon = '') {
    if (!toastEl) {
      toastEl = document.createElement('div');
      Object.assign(toastEl.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        background: 'rgba(30,30,30,0.92)',
        color: '#fff',
        padding: '10px 16px',
        borderRadius: '10px',
        fontSize: '14px',
        fontFamily: 'system-ui, sans-serif',
        zIndex: '2147483647',
        pointerEvents: 'none',
        transition: 'opacity 0.2s',
        opacity: '0',
        backdropFilter: 'blur(6px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      });
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = icon ? `${icon} ${text}` : text;
    toastEl.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.style.opacity = '0'; }, 1800);
  }

  // ─── Обработчик команд ───────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const action = message.action;

    if (action === 'get-status') {
      const slider = findElement(SELECTORS.volumeSlider);
      const vol = slider ? Math.round((parseInt(slider.value) / parseInt(slider.max || 100)) * 100) : null;
      const titleEl = document.querySelector('[class*="TrackTitle"]') ||
                      document.querySelector('.track__title') ||
                      document.querySelector('[class*="track-title"]');
      sendResponse({
        volume: vol,
        track: titleEl ? titleEl.textContent.trim() : null
      });
      return;
    }

    switch (action) {
      case 'play-pause': {
        const btn = findElement(SELECTORS.playPause);
        if (btn) { btn.click(); showToast('▶/⏸ Пауза / Воспроизведение'); }
        else showToast('Кнопка Play/Pause не найдена');
        break;
      }
      case 'next-track': {
        const btn = findElement(SELECTORS.next);
        if (btn) { btn.click(); showToast('⏭ Следующий трек'); }
        else showToast('Кнопка "Следующий" не найдена');
        break;
      }
      case 'prev-track': {
        const btn = findElement(SELECTORS.prev);
        if (btn) { btn.click(); showToast('⏮ Предыдущий трек'); }
        else showToast('Кнопка "Предыдущий" не найдена');
        break;
      }
      case 'volume-up':   changeVolume(+1); break;
      case 'volume-down': changeVolume(-1); break;
      case 'like-track': {
        const btn = findElement(SELECTORS.like);
        if (btn) { btn.click(); showToast('❤️ Лайк!'); }
        else showToast('Кнопка лайка не найдена');
        break;
      }
    }
  });

  // Готово
  console.log('[ЯМ Хоткеи] Content script загружен');
})();
