<template>
  <div class="app-shell">
    <SessionSidebar
      persistent
      :sessions="sessionList"
      :current-id="currentSessionId"
      @switch="switchSession"
      @delete="deleteSession"
      @new="newChat"
    />

    <SessionSidebar
      :visible="sidebarVisible"
      :sessions="sessionList"
      :current-id="currentSessionId"
      @close="sidebarVisible = false"
      @switch="switchSession"
      @delete="deleteSession"
      @new="newChat"
    />

    <div class="app">
      <header class="header">
        <div class="header-inner">
          <button class="menu-btn" @click="sidebarVisible = true" aria-label="菜单">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="5" width="14" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="3" y="9.25" width="14" height="1.5" rx="0.75" fill="currentColor"/>
              <rect x="3" y="13.5" width="14" height="1.5" rx="0.75" fill="currentColor"/>
            </svg>
          </button>
          <h1 class="title">
            <span class="title-icon">✦</span>
            AI 智能助手
          </h1>
          <button class="header-btn" @click="newChat" title="新对话">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            新对话
          </button>
        </div>
      </header>

      <main class="chat-area" ref="chatRef">
        <div class="chat-scroll">
          <div v-if="messages.length === 0" class="welcome">
            <div class="welcome-graphic">
              <div class="welcome-ring"></div>
              <span class="welcome-icon">✦</span>
            </div>
            <h2 class="welcome-title">开始对话</h2>
            <p class="welcome-desc">由智谱 GLM-4.7-Flash 驱动，完全免费</p>
            <div class="welcome-suggestions">
              <button class="suggestion-btn" @click="suggestClick('用 Python 写一个快速排序')">
                <span class="suggestion-icon">⌨️</span>
                写一段代码
              </button>
              <button class="suggestion-btn" @click="suggestClick('解释什么是RESTful API')">
                <span class="suggestion-icon">📖</span>
                解释概念
              </button>
              <button class="suggestion-btn" @click="suggestClick('帮我润色这段话：')">
                <span class="suggestion-icon">✏️</span>
                润色文本
              </button>
              <button class="suggestion-btn" @click="suggestClick('给我一些学习前端的建议')">
                <span class="suggestion-icon">💡</span>
                学习建议
              </button>
            </div>
          </div>

          <div class="messages" v-else>
            <MessageBubble
              v-for="(msg, i) in messages"
              :key="i"
              :role="msg.role"
              :content="msg.content"
            />

            <div v-if="isLoading" class="thinking">
              <div class="thinking-bubble">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ChatInput
        :disabled="isLoading"
        @send="handleSend"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted } from 'vue';
import MessageBubble from './components/MessageBubble.vue';
import ChatInput from './components/ChatInput.vue';
import SessionSidebar from './components/SessionSidebar.vue';
import { sendMessage } from './api/chat.js';

const STORAGE_KEY = 'zhipu-sessions';

const messages = ref([]);
const isLoading = ref(false);
const chatRef = ref(null);
const sidebarVisible = ref(false);
const currentSessionId = ref('');
const sessions = ref({});

const sessionList = computed(() => {
  return Object.values(sessions.value).sort((a, b) => b.updatedAt - a.updatedAt);
});

function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      sessions.value = data.sessions || {};
      currentSessionId.value = data.currentId || '';
      if (currentSessionId.value && sessions.value[currentSessionId.value]) {
        messages.value = sessions.value[currentSessionId.value].messages || [];
      }
    }
  } catch { /* ignore */ }
}

function saveSessions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentId: currentSessionId.value,
      sessions: sessions.value,
    }));
  } catch { /* ignore */ }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function newChat() {
  const id = generateId();
  sessions.value[id] = {
    id,
    title: '',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  currentSessionId.value = id;
  messages.value = [];
  saveSessions();
}

function switchSession(id) {
  const session = sessions.value[id];
  if (session) {
    currentSessionId.value = id;
    messages.value = session.messages || [];
    saveSessions();
  }
}

function deleteSession(id) {
  delete sessions.value[id];
  if (currentSessionId.value === id) {
    const remaining = Object.keys(sessions.value);
    if (remaining.length > 0) {
      switchSession(remaining[0]);
    } else {
      currentSessionId.value = '';
      messages.value = [];
    }
  }
  saveSessions();
}

function ensureCurrentSession() {
  if (!currentSessionId.value || !sessions.value[currentSessionId.value]) {
    newChat();
  }
}

function scrollToBottom() {
  nextTick(() => {
    const el = chatRef.value;
    if (el) el.scrollTop = el.scrollHeight;
  });
}

watch(() => messages.value.length, () => scrollToBottom());

function suggestClick(text) {
  ensureCurrentSession();
  handleSend(text);
}

async function handleSend(text) {
  ensureCurrentSession();

  messages.value.push({ role: 'user', content: text });
  isLoading.value = true;
  scrollToBottom();

  const apiMessages = [
    { role: 'system', content: '你是一个AI助手，请用Markdown格式回答用户的问题。使用合适的标题、列表、代码块、表格等格式让回答更清晰易读。' },
    ...messages.value
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content })),
  ];

  const content = await (async () => {
    try {
      const result = await sendMessage(apiMessages);
      if (result.success) return result.message;
      return '抱歉，出错了：' + (result.error || '请求失败');
    } catch (err) {
      return '抱歉，出错了：' + err.message;
    }
  })();

  isLoading.value = false;
  messages.value.push({ role: 'assistant', content });
  scrollToBottom();

  saveCurrentSession();
}

function saveCurrentSession() {
  const session = sessions.value[currentSessionId.value];
  if (session) {
    session.messages = JSON.parse(JSON.stringify(messages.value));
    session.updatedAt = Date.now();
    if (!session.title) {
      const firstUser = session.messages.find((m) => m.role === 'user');
      session.title = firstUser ? firstUser.content.slice(0, 30) + (firstUser.content.length > 30 ? '...' : '') : '新对话';
    }
    saveSessions();
  }
}

onMounted(() => {
  loadSessions();
  if (!currentSessionId.value) {
    newChat();
  }
});
</script>

<style>
:root {
  --bg-page: #f2ede4;
  --bg-surface: #faf8f4;
  --bg-sidebar: #e8e1d7;
  --bg-card: #faf8f4;
  --text-primary: #2c2924;
  --text-secondary: #7a7267;
  --text-muted: #9a9388;
  --accent: #c97d60;
  --accent-hover: #b86a4e;
  --accent-soft: #e8d5cc;
  --sage: #7a8b75;
  --border: #e5ddd4;
  --shadow-sm: 0 1px 3px rgba(44, 41, 36, 0.06);
  --shadow-md: 0 4px 16px rgba(44, 41, 36, 0.08);
  --shadow-lg: 0 8px 32px rgba(44, 41, 36, 0.1);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --font-ui: 'Sora', -apple-system, BlinkMacSystemFont, sans-serif;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-ui);
  background: var(--bg-page);
  color: var(--text-primary);
  height: 100vh;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-shell {
  height: 100vh;
  display: flex;
}

.app {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-width: 0;
  background: #fff;
}

.header {
  flex-shrink: 0;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid var(--border);
}

.header-inner {
  display: flex;
  align-items: center;
  height: 60px;
  gap: 12px;
  max-width: 800px;
  margin: 0 auto;
}

.menu-btn {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  color: var(--text-secondary);
  transition: background 0.15s;
}

.menu-btn:hover {
  background: rgba(44, 41, 36, 0.06);
}

.title {
  font-size: 16px;
  font-weight: 600;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  color: var(--accent);
  font-size: 18px;
}

.header-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.header-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(201, 125, 96, 0.06);
}

.chat-area {
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.chat-area::-webkit-scrollbar { width: 6px; }
.chat-area::-webkit-scrollbar-track { background: transparent; }
.chat-area::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

.chat-scroll {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 20px 8px;
}

.messages {
  /* container for message list */
}

/* Welcome */

.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 180px);
  text-align: center;
  padding: 40px 20px;
}

.welcome-graphic {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.welcome-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid var(--border);
  animation: ringPulse 3s ease-in-out infinite;
}

.welcome-icon {
  font-size: 32px;
  color: var(--accent);
  animation: iconFloat 3s ease-in-out infinite;
}

.welcome-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.welcome-desc {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 32px;
}

.welcome-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  max-width: 480px;
}

.suggestion-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: 1px solid var(--border);
  border-radius: 100px;
  background: var(--bg-surface);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(201, 125, 96, 0.06);
  transform: translateY(-1px);
}

.suggestion-icon {
  font-size: 16px;
}

/* Thinking indicator */

.thinking {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 20px;
  animation: messageIn 0.3s ease;
}

.thinking-bubble {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  border-bottom-left-radius: 4px;
  padding: 16px 20px;
  display: flex;
  gap: 5px;
  box-shadow: var(--shadow-sm);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-muted);
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }
.dot:nth-child(3) { animation-delay: 0s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); }
  40% { transform: scale(1); }
}

@keyframes messageIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes ringPulse {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.15); opacity: 0.7; }
}

@keyframes iconFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

/* Desktop */
@media (min-width: 768px) {
  .menu-btn { display: none; }
}

/* Mobile */
@media (max-width: 767px) {
  .menu-btn { display: flex; }

  .header { padding: 0 12px; }
  .header-inner { height: 56px; }

  .title { font-size: 15px; }
  .title-icon { display: none; }

  .header-btn span { display: none; }
  .header-btn {
    padding: 7px 9px;
  }

  .chat-scroll { padding: 16px 10px 4px; }

  .welcome { min-height: calc(100vh - 140px); padding: 24px 12px; }
  .welcome-title { font-size: 20px; }
  .welcome-suggestions { gap: 8px; }
  .suggestion-btn { padding: 8px 14px; font-size: 12px; }
}
</style>
