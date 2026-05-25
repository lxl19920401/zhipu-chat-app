const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.ZHIPU_API_KEY;
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

console.log('API Key loaded:', API_KEY ? API_KEY.slice(0, 8) + '...' : 'MISSING!');

async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i <= maxRetries; i++) {
    const response = await fetch(url, options);
    if (response.status !== 429 || i === maxRetries) return response;
    const wait = Math.pow(2, i) * 1000;
    console.log(`Rate limited, retrying in ${wait}ms... (attempt ${i + 1}/${maxRetries})`);
    await new Promise((r) => setTimeout(r, wait));
  }
}

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    apiKeyLoaded: !!API_KEY,
    apiKeyPrefix: API_KEY ? API_KEY.slice(0, 8) + '...' : null
  });
});

// Test endpoint: directly call Zhipu API and return raw result
app.post('/api/test', async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ error: 'API Key not loaded. Check backend/.env file.' });
  }
  const { messages } = req.body || { messages: [{ role: 'user', content: 'Hello' }] };
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-4.7',
        messages,
        temperature: 1.0,
        stream: false
      })
    });
    const data = await response.json();
    res.json({
      status: response.status,
      ok: response.ok,
      data
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const response = await fetchWithRetry(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-4.7',
        messages,
        temperature: 1,
        max_tokens: 2000,
        stream: false
      })
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: data.error?.message || 'API error' });
    }
    res.json({
      success: true,
      message: data.choices[0].message.content,
      tokens: data.usage?.total_tokens || 0
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/chat/stream', async (req, res) => {
  const { messages } = req.body;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let aborted = false;
  req.on('close', () => { aborted = true; });

  try {
    const response = await fetchWithRetry(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-4.7',
        messages,
        temperature: 1
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      res.write('data: ' + JSON.stringify({ error: errData.error?.message || 'API error' }) + '\n\n');
      res.end();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (!aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          res.write('data: ' + JSON.stringify({ content: null, done: true }) + '\n\n');
          continue;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            res.write('data: ' + JSON.stringify({ content, done: false }) + '\n\n');
          }
        } catch (e) { /* skip */ }
      }
    }

    if (!aborted) {
      res.write('data: ' + JSON.stringify({ content: null, done: true }) + '\n\n');
    }
    res.end();
  } catch (error) {
    if (!aborted) {
      res.write('data: ' + JSON.stringify({ error: error.message }) + '\n\n');
      res.end();
    }
  }
});

app.listen(PORT, () => {
  console.log('Backend running on http://localhost:' + PORT);
});
