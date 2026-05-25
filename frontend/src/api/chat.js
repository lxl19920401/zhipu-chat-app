const BASE = '/api';

export async function sendMessage(messages) {
  const res = await fetch(BASE + '/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  return res.json();
}

export function sendMessageStream(messages, { onChunk, onDone, onError }) {
  const controller = new AbortController();

  fetch(BASE + '/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        onError(err.error || 'Request failed');
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const data = JSON.parse(trimmed.slice(6));
          if (data.done) { onDone(); return; }
          if (data.error) { onError(data.error); return; }
          if (data.content) onChunk(data.content);
        }
      }
      onDone();
    })
    .catch((err) => {
      if (err.name !== 'AbortError') onError(err.message);
    });

  return controller;
}
