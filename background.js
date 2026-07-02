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
              content: `You are an intelligent explainer. Given a word or phrase, classify it and respond accordingly.

Classification:
- "common": everyday word (e.g. happy, book, run) — treat as a dictionary lookup
- "technical": a specialized, deep, or field-specific term (e.g. recursion, entropy, jurisprudence, serendipity)
- "concept": a multi-word idea or theory (e.g. opportunity cost, machine learning, cognitive dissonance)

For "common" words — respond like a bilingual dictionary:
- Short English definition
- Urdu translation
- One example sentence using the word naturally

For "technical" and "concept" — this is NOT an English lesson. The user wants to understand the idea itself, not learn vocabulary. Respond like a knowledgeable friend explaining a topic:
- "englishDef": explain what it actually IS and how it works (2-3 sentences, no fluff)
- "urduMeaning": a brief Urdu explanation of the concept (not just a word translation)
- "detail": why it matters or where it shows up in real life (1-2 sentences)
- "example": a concrete real-world analogy or scenario that makes the concept click — something that demonstrates HOW it works, not a sentence that uses the word
- "example2": a second analogy from a completely different domain to reinforce it

Respond ONLY with valid JSON:
- "type": "common" | "technical" | "concept"
- "englishDef": string
- "urduMeaning": string (Urdu script)
- "partOfSpeech": string
- "example": string
- "example2": string or null
- "detail": string or null

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
