// content.js — управление плеером ЯМ

(function () {
  if (window.__ymHotkeysLoaded) return;
  window.__ymHotkeysLoaded = true;

  // ─── Поиск кнопок плеера ──────────────────────────────────────────────────
  // Стратегия: ищем по aria-label (самый надёжный способ),
  // затем по классам как запасной вариант

  function findButton(ariaFragments, classSelectors) {
    // 1. По aria-label
    const allButtons = document.querySelectorAll('button');
    for (const btn of allButtons) {
      const label = (btn.getAttribute('aria-label') || '').toLowerCase();
      if (ariaFragments.some(f => label.includes(f.toLowerCase()))) {
        return btn;
      }
    }
    // 2. По классам
    if (classSelectors) {
      for (const sel of classSelectors) {
        const el = document.querySelector(sel);
        if (el) return el;
      }
    }
    return null;
  }

  function clickPlay() {
    const btn = findButton(
      ['пауза', 'pause', 'воспроизвести', 'play', 'продолжить', 'resume'],
      [
        '[class*="PlayerBar_buttonPlay"]',
        '[class*="player-controls__btn_play"]',
        '[class*="ButtonPlay"]',
        '[class*="playPause"]',
        '[class*="play-pause"]',
      ]
    );
    if (btn) {
      btn.click();
      showToast('▶/⏸');
    } else {
      // Последний шанс — найти кнопку с SVG play/pause иконкой
      // Яндекс использует d3-like path для иконок
      const svgBtns = document.querySelectorAll('button svg');
      for (const svg of svgBtns) {
        const parent = svg.closest('button');
        if (!parent) continue;
        const cls = parent.className || '';
        if (cls.includes('play') || cls.includes('Play') || cls.includes('pause') || cls.includes('Pause')) {
          parent.click();
          showToast('▶/⏸');
          return;
        }
      }
      showToast('Play/Pause: кнопка не найдена');
    }
  }

  function clickNext() {
    const btn = findButton(
      ['следующий', 'next', 'вперёд', 'вперед', 'skip'],
      [
        '[class*="PlayerBar_buttonNext"]',
        '[class*="player-controls__btn_next"]',
        '[class*="ButtonNext"]',
        '[class*="buttonNext"]',
      ]
    );
    if (btn) { btn.click(); showToast('⏭ Следующий'); }
    else showToast('Next: кнопка не найдена');
  }

  function clickPrev() {
    const btn = findButton(
      ['предыдущий', 'prev', 'назад', 'back'],
      [
        '[class*="PlayerBar_buttonPrev"]',
        '[class*="player-controls__btn_prev"]',
        '[class*="ButtonPrev"]',
        '[class*="buttonPrev"]',
      ]
    );
    if (btn) { btn.click(); showToast('⏮ Предыдущий'); }
    else showToast('Prev: кнопка не найдена');
  }

  // ─── Громкость через KeyboardEvent на слайдере ────────────────────────────
  // Нажатие ArrowUp/ArrowDown на focused range input — стандартный и безопасный способ
  function changeVolume(direction) {
    // Ищем слайдер громкости
    const slider = findVolumeSlider();
    if (!slider) {
      // Запасной вариант: кнопки громкости
      const btn = findButton(
        direction > 0
          ? ['громче', 'volume up', 'увеличить громкость']
          : ['тише', 'volume down', 'уменьшить громкость'],
        []
      );
      if (btn) { btn.click(); }
      showToast(direction > 0 ? '🔊' : '🔉');
      return;
    }

    // Фокусируем и отправляем клавишу
    slider.focus();
    const key = direction > 0 ? 'ArrowUp' : 'ArrowDown';
    // Шлём несколько нажатий для шага ~10%
    for (let i = 0; i < 10; i++) {
      slider.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      slider.dispatchEvent(new KeyboardEvent('keyup',   { key, bubbles: true }));
    }
    // Показываем текущее значение
    setTimeout(() => {
      const val = slider.value;
      const max = slider.max || 100;
      const pct = Math.round((val / max) * 100);
      showToast(direction > 0 ? `🔊 ${pct}%` : `🔉 ${pct}%`);
      slider.blur();
    }, 50);
  }

  function findVolumeSlider() {
    // Пробуем разные варианты
    const selectors = [
      'input[type="range"][class*="olume"]',
      'input[type="range"][aria-label*="ромкость"]',
      'input[type="range"][aria-label*="olume"]',
      '[class*="Volume"] input[type="range"]',
      '[class*="volume"] input[type="range"]',
      'input[type="range"]',  // последний шанс — любой range
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  // ─── Тост ─────────────────────────────────────────────────────────────────
  let toastEl = null;
  let toastTimer = null;

  function showToast(text) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      Object.assign(toastEl.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        background: 'rgba(20,20,20,0.9)',
        color: '#fff',
        padding: '9px 15px',
        borderRadius: '10px',
        fontSize: '14px',
        fontFamily: 'system-ui, sans-serif',
        zIndex: '2147483647',
        pointerEvents: 'none',
        transition: 'opacity 0.2s',
        opacity: '0',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
      });
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = text;
    toastEl.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.style.opacity = '0'; }, 1600);
  }

  // ─── Диагностика — выводит список кнопок в консоль ───────────────────────
  function diagnose() {
    console.group('[ЯМ Хоткеи] Кнопки на странице:');
    document.querySelectorAll('button').forEach(btn => {
      const label = btn.getAttribute('aria-label');
      const cls = btn.className?.toString().slice(0, 60);
      if (label || cls?.includes('play') || cls?.includes('Play') || cls?.includes('next') || cls?.includes('prev')) {
        console.log(`aria-label="${label}" class="${cls}"`);
      }
    });
    console.log('[Слайдеры]', document.querySelectorAll('input[type="range"]'));
    console.groupEnd();
  }

  // ─── Обработчик сообщений ─────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case 'play-pause':  clickPlay(); break;
      case 'next-track':  clickNext(); break;
      case 'prev-track':  clickPrev(); break;
      case 'volume-up':   changeVolume(+1); break;
      case 'volume-down': changeVolume(-1); break;
      case 'diagnose':    diagnose(); break;
      case 'get-status': {
        const slider = findVolumeSlider();
        const vol = slider ? Math.round((parseInt(slider.value) / parseInt(slider.max || 100)) * 100) : null;
        const titleEl = document.querySelector('[class*="TrackTitle"]') ||
                        document.querySelector('[class*="track-title"]') ||
                        document.querySelector('.track__title');
        sendResponse({ volume: vol, track: titleEl?.textContent?.trim() || null });
        return;
      }
    }
  });

  console.log('[ЯМ Хоткеи] Загружен. Для диагностики: chrome.runtime.sendMessage({action:"diagnose"})');
})();
