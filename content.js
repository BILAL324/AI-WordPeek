(() => {
  let popup = null;
  let currentWord = '';

  function getWordAtPoint(x, y) {
    let range;
    if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(x, y);
    } else if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(x, y);
      if (!pos) return null;
      range = document.createRange();
      range.setStart(pos.offsetNode, pos.offset);
      range.setEnd(pos.offsetNode, pos.offset);
    } else {
      return null;
    }
    if (!range || range.startContainer.nodeType !== Node.TEXT_NODE) return null;
    range.expand('word');
    const word = range.toString().trim().replace(/[^a-zA-Z'-]/g, '');
    return word.length > 1 ? word.toLowerCase() : null;
  }

  function removePopup() {
    if (popup) { popup.remove(); popup = null; currentWord = ''; }
  }

  function createAndPlace(x, y) {
    removePopup();
    popup = document.createElement('div');
    popup.id = 'wmp-popup';
    document.body.appendChild(popup);

    // position after brief paint so getBoundingClientRect is valid
    requestAnimationFrame(() => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const rect = popup.getBoundingClientRect();
      let left = x + 14, top = y + 14;
      if (left + rect.width  > vw - 12) left = x - rect.width  - 14;
      if (top  + rect.height > vh - 12) top  = y - rect.height - 14;
      popup.style.left = Math.max(8, left) + 'px';
      popup.style.top  = Math.max(8, top)  + 'px';
    });
  }

  function renderLoading(word) {
    if (!popup) return;
    popup.innerHTML = `
      <div class="wmp-header">
        <span class="wmp-word">${word}</span>
        <button class="wmp-close">✕</button>
      </div>
      <div class="wmp-loading">
        <div class="wmp-spinner"></div>
        <span>Looking up...</span>
      </div>`;
    popup.querySelector('.wmp-close').onclick = (e) => { e.stopPropagation(); removePopup(); };
  }

  function saveToHistory(word, data) {
    chrome.storage.local.get('wordHistory', ({ wordHistory }) => {
      const history = wordHistory || {};
      history[word] = {
        word,
        englishDef: data.englishDef,
        urduMeaning: data.urduMeaning,
        partOfSpeech: data.partOfSpeech || '',
        example: data.example || '',
        savedAt: new Date().toISOString(),
        lookupCount: (history[word]?.lookupCount || 0) + 1,
      };
      chrome.storage.local.set({ wordHistory: history });
    });
  }

  function renderResult(word, data) {
    if (!popup) return;
    popup.innerHTML = `
      <div class="wmp-header">
        <div class="wmp-title-row">
          <span class="wmp-word">${word}</span>
          ${data.partOfSpeech ? `<span class="wmp-pos">${data.partOfSpeech}</span>` : ''}
        </div>
        <button class="wmp-close">✕</button>
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
        ${data.example ? `
        <div class="wmp-divider"></div>
        <div class="wmp-example-block">
          <span class="wmp-example-label">Example</span>
          <p class="wmp-example">"${data.example}"</p>
        </div>` : ''}
      </div>
      <div class="wmp-footer">
        <a class="wmp-history-link" href="#" id="wmp-open-history">📚 View Word History</a>
      </div>`;
    popup.querySelector('.wmp-close').onclick = (e) => { e.stopPropagation(); removePopup(); };
    popup.querySelector('#wmp-open-history').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.sendMessage({ type: 'OPEN_HISTORY' });
    });
    saveToHistory(word, data);
  }

  function renderError(word, message) {
    if (!popup) return;
    popup.innerHTML = `
      <div class="wmp-header">
        <span class="wmp-word">${word}</span>
        <button class="wmp-close">✕</button>
      </div>
      <div class="wmp-error">${message}</div>`;
    popup.querySelector('.wmp-close').onclick = (e) => { e.stopPropagation(); removePopup(); };
    const link = popup.querySelector('#wmp-open-options');
    if (link) link.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
    });
  }

  function lookup(word, x, y) {
    if (!word || word === currentWord) return;
    currentWord = word;
    createAndPlace(x, y);
    renderLoading(word);

    chrome.runtime.sendMessage({ type: 'LOOKUP_WORD', word }, (response) => {
      if (!popup) return;
      if (response?.error === 'no_key') {
        renderError(word, 'No API key set. <a class="wmp-link" href="#" id="wmp-open-options">Open settings →</a>');
        return;
      }
      if (response?.error) { renderError(word, `Error: ${response.error}`); return; }
      if (response?.result) renderResult(word, response.result);
    });
  }

  // Double-click: browser already selects the word — grab it from selection
  document.addEventListener('dblclick', (e) => {
    if (popup && popup.contains(e.target)) return;
    const sel = window.getSelection()?.toString().trim().replace(/[^a-zA-Z'-]/g, '').toLowerCase();
    if (sel && sel.length > 1) lookup(sel, e.clientX, e.clientY);
  });

  // Single-click: use caret position to find word under cursor
  document.addEventListener('click', (e) => {
    if (popup && popup.contains(e.target)) return;
    const word = getWordAtPoint(e.clientX, e.clientY);
    if (word) lookup(word, e.clientX, e.clientY);
  });

  // Close when clicking outside popup
  document.addEventListener('mousedown', (e) => {
    if (popup && !popup.contains(e.target)) removePopup();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') removePopup();
  });
})();
