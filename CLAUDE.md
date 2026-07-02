# AI-WordPeek — Chrome Extension

## What This Is
A Chrome browser extension (Manifest V3) that shows an instant popup with English definition, Urdu meaning, part of speech, and an example sentence when the user **double-clicks** any word on any webpage. Powered by **OpenAI GPT-4o mini**.

## GitHub Repo
https://github.com/BILAL324/AI-WordPeek

## File Structure
| File | Purpose |
|------|---------|
| `manifest.json` | Extension config — Manifest V3, permissions: `storage`, `tabs` |
| `background.js` | Service worker — handles OpenAI API calls, opens options/history pages |
| `content.js` | Injected into every page — detects double-click, shows popup, saves to history |
| `style.css` | Popup UI styles (injected alongside content.js) |
| `options.html/js` | Settings page — user enters OpenAI API key (stored in chrome.storage.sync) |
| `history.html/js` | Word history page — view, search, download CSV, reset |
| `icon.png` | Full-size icon (source image) |
| `icon16/48/128.png` | Resized icons for Chrome toolbar and extensions page |

## How It Works
1. User double-clicks a word → `content.js` grabs word from `window.getSelection()`
2. Sends `LOOKUP_WORD` message to `background.js`
3. `background.js` fetches OpenAI API key from `chrome.storage.sync`, calls `gpt-4o-mini`
4. Returns JSON: `{ englishDef, urduMeaning, partOfSpeech, example }`
5. `content.js` renders popup near cursor + auto-saves word to `chrome.storage.local`
6. Popup footer has "📚 View Word History" link → opens `history.html`

## Key Design Decisions
- **Double-click only** (not single click) — intentional, user preference
- **Auto-save every lookup** to `chrome.storage.local` as `wordHistory` object keyed by word
- Word history tracks: `englishDef`, `urduMeaning`, `partOfSpeech`, `example`, `savedAt` (ISO), `lookupCount`
- **CSV download** includes UTF-8 BOM (`﻿`) so Urdu script renders correctly in Excel
- API key stored in `chrome.storage.sync` (not local) so it syncs across Chrome instances
- OpenAI prompt uses `response_format: { type: 'json_object' }` for reliable structured output

## Message Types (content.js → background.js)
- `LOOKUP_WORD` — fetch definition from OpenAI
- `OPEN_OPTIONS` — open the settings page
- `OPEN_HISTORY` — open history.html in a new tab

## How to Reload After Changes
1. Go to `chrome://extensions`
2. Click the refresh icon (↺) on AI-WordPeek
3. Refresh the webpage you're testing on

## How to Push Changes
```bash
cd /home/bilal/Desktop/word-popup-extension
git add .
git commit -m "your message"
git push
```
