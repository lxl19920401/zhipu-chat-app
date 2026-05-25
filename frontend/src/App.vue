<template>
  <div class="app-layout">
    <SessionSidebar
      :visible="sidebarVisible"
      :sessions="sessionList"
      :current-id="currentSessionId"
      @close="sidebarVisible = false"
      @switch="switchSession"
      @delete="deleteSession"
    />

    <div class="app">
      <header class="header">
        <div class="header-inner">
          <button class="menu-btn" @click="sidebarVisible = true">☰</button>
          <h1 class="title">🤖 AI 智能助手</h1>
          <div class="header-actions">
            <button class="header-btn" @click="newChat" title="新对话">✨ 新对话</button>
          </div>
        </div>
      </header>

      <main class="chat-area" ref="chatRef">
        <div v-if="messages.length === 0" class="welcome">
          <div class="welcome-icon">🤖</div>
          <h2>你好！我是 AI 助手</h2>
          <p>由智谱 GLM-4.7-Flash 驱动，完全免费使用</p>
          <p class="hint">输入问题开始对话吧</p>
        </div>

        <div class="messages">
          <MessageBubble
            v-for="(msg, i) in messages"
            :key="i"
            :role="msg.role"
            :content="msg.content"
          />

          <div v-if="isLoading" class="thinking-indicator">
            <div class="thinking-bubble">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
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

async function handleSend(text) {
  ensureCurrentSession();

  messages.value.push({ role: 'user', content: text });
  isLoading.value = true;
  scrollToBottom();

  const aiMsg = { role: 'assistant', content: '' };
  messages.value.push(aiMsg);
  scrollToBottom();

  const apiMessages = [
    { role: 'system', content: '你是一个AI助手，请用Markdown格式回答用户的问题。使用合适的标题、列表、代码块、表格等格式让回答更清晰易读。' },
    ...messages.value
      .filter((m) => m !== aiMsg && m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    const result = await sendMessage(apiMessages);
    if (result.success) {
      aiMsg.content = result.message;
    } else {
      aiMsg.content = '抱歉，出错了：' + (result.error || '请求失败');
    }
  } catch (err) {
    aiMsg.content = '抱歉，出错了：' + err.message;
  }

  isLoading.value = false;
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
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f5f7fb;
  color: #333;
  height: 100vh;
  overflow: hidden;
}

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-layout {
  height: 100vh;
  display: flex;
  justify-content: center;
}

.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  max-width: 860px;
  width: 100%;
  background: #fff;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.06);
}

.header {
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  padding: 0 16px;
  flex-shrink: 0;
}

.header-inner {
  display: flex;
  align-items: center;
  height: 56px;
  gap: 12px;
  max-width: 800px;
  margin: 0 auto;
}

.menu-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  color: #666;
  transition: background 0.15s;
}
.menu-btn:hover {
  background: #f0f0f0;
}

.title {
  font-size: 16px;
  font-weight: 600;
  flex: 1;
}

.header-actions {
  flex-shrink: 0;
}

.header-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.header-btn:hover {
  opacity: 0.9;
}

.chat-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px 8px;
  scroll-behavior: smooth;
}

.chat-area::-webkit-scrollbar {
  width: 6px;
}

.chat-area::-webkit-scrollbar-track {
  background: transparent;
}

.chat-area::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}

.messages {
  max-width: 800px;
  margin: 0 auto;
}

.welcome {
  text-align: center;
  padding: 60px 20px;
  color: #888;
}

.welcome-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.welcome h2 {
  font-size: 22px;
  color: #333;
  margin-bottom: 8px;
}

.welcome p {
  font-size: 14px;
  line-height: 1.8;
}

.welcome .hint {
  margin-top: 12px;
  color: #aaa;
  font-size: 13px;
}

.thinking-indicator {
  display: flex;
  justify-content: flex-start;
  padding: 0 42px;
  margin-bottom: 16px;
  animation: fadeIn 0.3s ease;
}

.thinking-bubble {
  background: #f0f0f0;
  border-radius: 14px;
  border-bottom-left-radius: 4px;
  padding: 14px 18px;
  display: flex;
  gap: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #999;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }
.dot:nth-child(3) { animation-delay: 0s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); }
  40% { transform: scale(1); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 600px) {
  .app {
    box-shadow: none;
  }
  .message {
    max-width: 90% !important;
  }
  .chat-area {
    padding: 16px 10px 4px;
  }
  .input-area {
    padding: 8px 10px;
  }
}
</style>
