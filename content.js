(() => {
  let triggerBtn = null;
  let popup = null;
  let pendingText = '';
  let currentText = '';

  // ── Helpers ──────────────────────────────────────────────────────────────

  function removeTrigger() {
    if (triggerBtn) { triggerBtn.remove(); triggerBtn = null; pendingText = ''; }
  }

  function removePopup() {
    if (popup) { popup.remove(); popup = null; currentText = ''; }
  }

  function removeAll() { removeTrigger(); removePopup(); }

  // Position an element near (x, y) keeping it inside the viewport
  function placeElement(el, x, y) {
    el.style.left = '-9999px'; el.style.top = '-9999px';
    const vw = window.innerWidth, vh = window.innerHeight;
    const rect = el.getBoundingClientRect();
    let left = x + 10, top = y - rect.height - 10;
    if (left + rect.width  > vw - 8) left = x - rect.width  - 10;
    if (top < 8)                      top  = y + 14;
    if (top + rect.height > vh - 8)   top  = vh - rect.height - 8;
    el.style.left = Math.max(8, left) + 'px';
    el.style.top  = Math.max(8, top)  + 'px';
  }

  // ── Trigger icon ─────────────────────────────────────────────────────────

  function showTrigger(text, x, y) {
    removeTrigger();
    removePopup();
    pendingText = text;

    triggerBtn = document.createElement('div');
    triggerBtn.id = 'wmp-trigger';
    // Show a preview of the word/phrase
    const label = text.length > 18 ? text.slice(0, 16) + '…' : text;
    triggerBtn.innerHTML = `<span class="wmp-trigger-icon">📖</span><span class="wmp-trigger-label">${label}</span>`;

    triggerBtn.style.position = 'fixed';
    triggerBtn.style.zIndex = '2147483647';
    document.body.appendChild(triggerBtn);
    placeElement(triggerBtn, x, y);

    triggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = pendingText;
      // position popup where trigger was
      const rect = triggerBtn.getBoundingClientRect();
      removeTrigger();
      lookup(text, rect.left, rect.bottom + 8);
    });
  }

  // ── Popup renders ─────────────────────────────────────────────────────────

  function createPopup(x, y) {
    removePopup();
    popup = document.createElement('div');
    popup.id = 'wmp-popup';
    popup.style.position = 'fixed';
    popup.style.zIndex = '2147483647';
    document.body.appendChild(popup);
    requestAnimationFrame(() => placeElement(popup, x, y));
  }

  function closeBtn() {
    return `<button class="wmp-close">✕</button>`;
  }

  function bindClose() {
    popup?.querySelector('.wmp-close')?.addEventListener('click', (e) => {
      e.stopPropagation(); removeAll();
    });
    popup?.querySelector('#wmp-open-history')?.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.sendMessage({ type: 'OPEN_HISTORY' });
    });
    popup?.querySelector('#wmp-open-options')?.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
    });
  }

  function renderLoading(text) {
    if (!popup) return;
    popup.innerHTML = `
      <div class="wmp-header">
        <span class="wmp-word">${text}</span>
        ${closeBtn()}
      </div>
      <div class="wmp-loading">
        <div class="wmp-spinner"></div>
        <span>Looking up...</span>
      </div>`;
    bindClose();
  }

  function renderResult(text, data) {
    if (!popup) return;
    const isConcept = data.type === 'concept' || data.type === 'technical';
    if (isConcept) popup.classList.add('wmp-wide');

    popup.innerHTML = `
      <div class="wmp-header">
        <div class="wmp-title-row">
          <span class="wmp-word">${text}</span>
          ${data.partOfSpeech ? `<span class="wmp-pos">${data.partOfSpeech}</span>` : ''}
          ${isConcept ? `<span class="wmp-type-badge">${data.type === 'technical' ? '⚡ Technical' : '💡 Concept'}</span>` : ''}
        </div>
        ${closeBtn()}
      </div>
      <div class="wmp-body">

        <div class="wmp-section">
          <span class="wmp-badge en">EN</span>
          <p class="wmp-def">${data.englishDef}</p>
        </div>

        <div class="wmp-divider"></div>

        <div class="wmp-section">
          <span class="wmp-badge ur">UR</span>
          <p class="wmp-def wmp-urdu">${data.urduMeaning}</p>
        </div>

        ${data.detail ? `
        <div class="wmp-divider"></div>
        <div class="wmp-detail-block">
          <span class="wmp-detail-label">In Depth</span>
          <p class="wmp-detail">${data.detail}</p>
        </div>` : ''}

        ${data.example ? `
        <div class="wmp-divider"></div>
        <div class="wmp-example-block">
          <span class="wmp-example-label">Example</span>
          <p class="wmp-example">"${data.example}"</p>
        </div>` : ''}

        ${data.example2 ? `
        <div class="wmp-example-block" style="margin-top:6px">
          <p class="wmp-example">"${data.example2}"</p>
        </div>` : ''}

      </div>
      <div class="wmp-footer">
        <a class="wmp-history-link" href="#" id="wmp-open-history">📚 View Word History</a>
      </div>`;
    bindClose();
    saveToHistory(text, data);
  }

  function renderError(text, message) {
    if (!popup) return;
    popup.innerHTML = `
      <div class="wmp-header">
        <span class="wmp-word">${text}</span>
        ${closeBtn()}
      </div>
      <div class="wmp-error">${message}</div>`;
    bindClose();
  }

  // ── Save to history ───────────────────────────────────────────────────────

  function saveToHistory(text, data) {
    chrome.storage.local.get('wordHistory', ({ wordHistory }) => {
      const history = wordHistory || {};
      history[text] = {
        word: text,
        type: data.type || 'common',
        englishDef: data.englishDef,
        urduMeaning: data.urduMeaning,
        partOfSpeech: data.partOfSpeech || '',
        example: data.example || '',
        example2: data.example2 || '',
        detail: data.detail || '',
        savedAt: new Date().toISOString(),
        lookupCount: (history[text]?.lookupCount || 0) + 1,
      };
      chrome.storage.local.set({ wordHistory: history });
    });
  }

  // ── Lookup ────────────────────────────────────────────────────────────────

  function lookup(text, x, y) {
    if (!text || text === currentText) return;
    currentText = text;
    createPopup(x, y);
    renderLoading(text);

    chrome.runtime.sendMessage({ type: 'LOOKUP_WORD', word: text }, (response) => {
      if (!popup) return;
      if (response?.error === 'no_key') {
        renderError(text, 'No API key set. <a class="wmp-link" href="#" id="wmp-open-options">Open settings →</a>');
        return;
      }
      if (response?.error) { renderError(text, `Error: ${response.error}`); return; }
      if (response?.result) renderResult(text, response.result);
    });
  }

  // ── Event listeners ───────────────────────────────────────────────────────

  document.addEventListener('dblclick', (e) => {
    if (popup && popup.contains(e.target)) return;
    if (triggerBtn && triggerBtn.contains(e.target)) return;

    const sel = window.getSelection();
    const text = sel?.toString().trim().replace(/\s+/g, ' ');

    // Filter: must be letters/spaces only, at least 2 chars
    if (!text || text.length < 2 || !/[a-zA-Z]/.test(text)) return;

    showTrigger(text, e.clientX, e.clientY);
  });

  document.addEventListener('mousedown', (e) => {
    if (triggerBtn && !triggerBtn.contains(e.target)) removeTrigger();
    if (popup && !popup.contains(e.target)) removePopup();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') removeAll();
  });

})();
