chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'OPEN_OPTIONS') {
    chrome.runtime.openOptionsPage();
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
              content: `You are a dictionary assistant. Given a word, respond with a JSON object with exactly these fields:
- "englishDef": one concise English definition
- "urduMeaning": the Urdu meaning or translation (written in Urdu script)
- "partOfSpeech": e.g. noun, verb, adjective
- "example": one short natural English sentence using the word

Respond only with valid JSON. No extra text.`,
            },
            {
              role: 'user',
              content: `Word: ${request.word}`,
            },
          ],
          max_tokens: 200,
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
