chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'OPEN_OPTIONS') {
    chrome.runtime.openOptionsPage();
    return;
  }

  if (request.type === 'OPEN_HISTORY') {
    chrome.tabs.create({ url: chrome.runtime.getURL('history.html') });
    return;
  }

  if (request.type !== 'LOOKUP_WORD') return;

  chrome.storage.sync.get('openaiKey', async ({ openaiKey }) => {
    if (!openaiKey) {
      sendResponse({ error: 'no_key' });
      return;
    }

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are an intelligent dictionary and concept explainer. Given a word, phrase, or concept, first classify it then respond accordingly.

Classification rules:
- "common": everyday word most people know (e.g. happy, run, book) → short response
- "technical": uncommon, specialized, or deep word (e.g. serendipity, epistemology, recursion, jurisprudence) → detailed response
- "concept": a multi-word phrase or idea that needs context to understand (e.g. opportunity cost, cognitive dissonance, machine learning, dark matter) → thorough response

Respond ONLY with a valid JSON object with these fields:
- "type": "common" | "technical" | "concept"
- "englishDef": definition — 1 sentence for common, 2-3 sentences for technical/concept
- "urduMeaning": Urdu meaning or translation in Urdu script (اردو)
- "partOfSpeech": e.g. noun, verb, adjective, phrase, concept
- "example": one natural example sentence
- "example2": a second example sentence (only for concept/technical, otherwise null)
- "detail": null for common words; for technical/concept: 1-2 sentences of extra context, real-world relevance, or why it matters

No extra text outside the JSON.`,
            },
            {
              role: 'user',
              content: `Word or phrase: ${request.word}`,
            },
          ],
          max_tokens: 400,
          temperature: 0.3,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        sendResponse({ error: err?.error?.message || 'API error' });
        return;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      const parsed = JSON.parse(content);
      sendResponse({ result: parsed });
    } catch (e) {
      sendResponse({ error: e.message });
    }
  });

  return true; // keep message channel open for async response
});
