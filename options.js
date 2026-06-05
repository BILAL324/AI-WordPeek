const keyInput = document.getElementById('apiKey');
const saveBtn = document.getElementById('saveBtn');
const status = document.getElementById('status');
const toggleBtn = document.getElementById('toggleVisibility');

// Load existing key
chrome.storage.sync.get('openaiKey', ({ openaiKey }) => {
  if (openaiKey) keyInput.value = openaiKey;
});

// Toggle show/hide
toggleBtn.addEventListener('click', () => {
  const isPassword = keyInput.type === 'password';
  keyInput.type = isPassword ? 'text' : 'password';
  toggleBtn.textContent = isPassword ? '🙈' : '👁';
});

// Save key
saveBtn.addEventListener('click', () => {
  const key = keyInput.value.trim();

  if (!key) {
    showStatus('Please enter an API key.', 'error');
    return;
  }

  if (!key.startsWith('sk-')) {
    showStatus('That doesn\'t look like a valid OpenAI key (should start with sk-).', 'error');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  chrome.storage.sync.set({ openaiKey: key }, () => {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save API Key';
    showStatus('API key saved! You can now click any word on any webpage.', 'success');
  });
});

function showStatus(message, type) {
  status.textContent = message;
  status.className = `status ${type}`;
  setTimeout(() => { status.className = 'status'; }, 4000);
}
