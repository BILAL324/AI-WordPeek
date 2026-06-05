let allWords = [];

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function renderCards(words) {
  const grid = document.getElementById('wordGrid');
  const stats = document.getElementById('stats');

  if (!words.length) {
    stats.innerHTML = '';
    grid.innerHTML = `
      <div class="empty" style="grid-column:1/-1">
        <div style="font-size:48px">📭</div>
        <p>No words found. Start clicking words on any webpage!</p>
      </div>`;
    return;
  }

  stats.innerHTML = `Showing <strong>${words.length}</strong> word${words.length !== 1 ? 's' : ''}`;

  grid.innerHTML = words.map(w => `
    <div class="word-card">
      <div class="card-header">
        <div style="display:flex;align-items:center;gap:8px">
          <span class="card-word">${w.word}</span>
          ${w.partOfSpeech ? `<span class="card-pos">${w.partOfSpeech}</span>` : ''}
        </div>
        <span class="card-count">${w.lookupCount}×</span>
      </div>

      <div class="card-section">
        <span class="badge en">EN</span>
        <p class="card-def">${w.englishDef}</p>
      </div>

      <div class="card-section">
        <span class="badge ur">UR</span>
        <p class="card-def card-urdu">${w.urduMeaning}</p>
      </div>

      ${w.example ? `<p class="card-example">"${w.example}"</p>` : ''}
      <p class="card-date">${formatDate(w.savedAt)}</p>
    </div>
  `).join('');
}

function loadHistory() {
  chrome.storage.local.get('wordHistory', ({ wordHistory }) => {
    const history = wordHistory || {};
    allWords = Object.values(history).sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    renderCards(allWords);
  });
}

// Search
document.getElementById('searchInput').addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  const filtered = q
    ? allWords.filter(w =>
        w.word.includes(q) ||
        w.englishDef.toLowerCase().includes(q) ||
        w.urduMeaning.includes(q)
      )
    : allWords;
  renderCards(filtered);
});

// Download CSV
document.getElementById('downloadBtn').addEventListener('click', () => {
  if (!allWords.length) return;

  const headers = ['Word', 'Part of Speech', 'English Definition', 'Urdu Meaning', 'Example Sentence', 'Date Saved', 'Times Looked Up'];

  const escape = (val) => `"${String(val || '').replace(/"/g, '""')}"`;

  const rows = allWords.map(w => [
    escape(w.word),
    escape(w.partOfSpeech),
    escape(w.englishDef),
    escape(w.urduMeaning),
    escape(w.example),
    escape(formatDate(w.savedAt)),
    escape(w.lookupCount),
  ].join(','));

  const csv = '﻿' + [headers.join(','), ...rows].join('\n'); // BOM for Excel UTF-8
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AI-WordPeek-history-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

// Reset
const overlay = document.getElementById('confirmOverlay');
document.getElementById('resetBtn').addEventListener('click', () => {
  overlay.style.display = 'flex';
});
document.getElementById('cancelReset').addEventListener('click', () => {
  overlay.style.display = 'none';
});
document.getElementById('confirmReset').addEventListener('click', () => {
  chrome.storage.local.remove('wordHistory', () => {
    allWords = [];
    overlay.style.display = 'none';
    renderCards([]);
  });
});

loadHistory();
