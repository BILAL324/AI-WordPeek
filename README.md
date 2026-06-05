# AI-WordPeek — AI-Powered English & Urdu Dictionary Chrome Extension

<img src="icon.png" alt="AI-WordPeek" width="120" />

> Click any word on any webpage to instantly get its English definition, Urdu translation, and a real example sentence — powered by GPT-4o mini.

---

## What It Does

**AI-WordPeek** is a free, open-source Chrome extension that turns your entire browser into a smart dictionary. No more switching tabs or opening separate apps to look up words. Just click (or double-click) any word on any website and a clean popup appears right next to your cursor with:

- **English definition** — clear and concise
- **Urdu meaning** — written in Urdu script (اردو)
- **Part of speech** — noun, verb, adjective, etc.
- **Example sentence** — a natural sentence to understand the word in context

All powered by **OpenAI GPT-4o mini** — fast, accurate, and context-aware.

---

## Features

- **One-click lookup** — works on any webpage: Wikipedia, YouTube, news sites, PDFs, anywhere
- **English + Urdu** — bilingual support out of the box
- **AI-generated definitions** — GPT-4o mini gives natural, human-quality explanations
- **Example sentences** — understand how the word is actually used
- **Lightweight** — no bloat, no trackers, no permissions beyond what's needed
- **Privacy-first** — your API key is stored locally in your browser, never on any server
- **Keyboard shortcut** — press `Escape` to dismiss the popup instantly
- **Works everywhere** — any language page, any website, any content

---

## Demo

| Click a word | Get instant meaning |
|---|---|
| Single or double-click any word | Popup appears with English def, Urdu translation & example |

---

## Installation

### From Source (Developer Mode)

1. **Download or clone this repository**
   ```bash
   git clone https://github.com/yourusername/word-meaning-popup.git
   ```

2. **Open Chrome Extensions page**
   - Navigate to `chrome://extensions`
   - Enable **Developer mode** (toggle in the top-right corner)

3. **Load the extension**
   - Click **Load unpacked**
   - Select the `word-meaning-popup` folder

4. **Add your OpenAI API key**
   - Click the extension icon in the Chrome toolbar
   - Paste your OpenAI API key (`sk-...`) and click **Save**
   - Get a free key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

5. **Start using it**
   - Go to any webpage
   - Click any word
   - The popup appears instantly

---

## How It Works

```
User clicks a word on any webpage
        ↓
content.js detects the word under cursor
        ↓
Sends message to background service worker
        ↓
background.js calls OpenAI GPT-4o mini API
        ↓
Returns: English definition + Urdu meaning + example sentence (JSON)
        ↓
Popup renders near cursor with all information
```

The extension uses **Manifest V3** (the latest Chrome extension standard) with a background service worker to securely make API calls without exposing your key to the page.

---

## File Structure

```
word-meaning-popup/
├── manifest.json      # Extension config (Manifest V3)
├── background.js      # Service worker — handles OpenAI API calls
├── content.js         # Injected into every page — detects clicks, shows popup
├── style.css          # Popup UI styles
├── options.html       # Settings page for API key
├── options.js         # Settings page logic
├── icon16.png         # Extension icons
├── icon48.png
└── icon128.png
```

---

## Tech Stack

| Component | Technology |
|---|---|
| Extension platform | Chrome Manifest V3 |
| AI model | OpenAI GPT-4o mini |
| Languages | Vanilla JavaScript, CSS |
| Storage | `chrome.storage.sync` (local browser) |
| Permissions | `storage`, `api.openai.com` host only |

---

## Privacy & Security

- Your **OpenAI API key** is stored only in your browser via `chrome.storage.sync` — it never touches any third-party server
- The only external request made is directly to **api.openai.com** — no middleman, no analytics, no tracking
- The extension does **not** collect, store, or transmit any of the words you look up
- Minimal permissions — only `storage` permission requested

---

## Cost

Using your own OpenAI API key, GPT-4o mini costs approximately:
- **$0.15 per 1M input tokens** / **$0.60 per 1M output tokens**
- Each word lookup uses ~100–200 tokens total
- **~5,000–10,000 word lookups for $1** — essentially free for personal use

---

## Contributing

Contributions are welcome! Here are some ideas:

- [ ] Support for more languages (Hindi, Arabic, French, etc.)
- [ ] Right-click context menu option
- [ ] Pronunciation audio via text-to-speech
- [ ] Word history / saved words list
- [ ] Firefox support (WebExtensions API compatible)
- [ ] Dark mode popup theme

### How to Contribute

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## Requirements

- Google Chrome (v88+) or any Chromium-based browser (Edge, Brave, Arc)
- An [OpenAI API key](https://platform.openai.com/api-keys) (free tier available)

---

## License

MIT License — free to use, modify, and distribute. See [LICENSE](LICENSE) for details.

---

## Keywords

chrome extension dictionary, urdu english dictionary extension, word meaning chrome extension, AI dictionary browser extension, GPT-4o mini chrome extension, click to translate urdu, english urdu dictionary online, browser dictionary popup, word definition extension, open source chrome extension dictionary, urdu translation extension chrome, bilingual dictionary extension
