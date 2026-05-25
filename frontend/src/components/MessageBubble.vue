<template>
  <div class="message-wrapper" :class="role">
    <div class="message">
      <div class="avatar" :class="role">
        <span v-if="role === 'user'">👤</span>
        <span v-else>✦</span>
      </div>
      <div class="bubble">
        <div v-if="role === 'user'" class="content user-content">{{ content }}</div>
        <div v-else class="content markdown-body" v-html="renderedContent"></div>
        <div v-if="role === 'assistant' && content" class="bubble-actions">
          <button class="action-btn" @click="copyContent" :title="copied ? '已复制' : '复制'">
            <svg v-if="copied" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7.5L5 10.5L12 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            <svg v-else width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2.5" y="4.5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M4.5 4V3A1.5 1.5 0 0 1 6 1.5h5A1.5 1.5 0 0 1 12.5 3v5a1.5 1.5 0 0 1-1.5 1.5h-1" stroke="currentColor" stroke-width="1.2"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { marked } from 'marked';

const props = defineProps({
  role: { type: String, required: true },
  content: { type: String, default: '' },
});

const copied = ref(false);

const renderedContent = computed(() => {
  if (!props.content) return '';
  return marked.parse(props.content, { breaks: true, gfm: true });
});

async function copyContent() {
  try {
    await navigator.clipboard.writeText(props.content);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch { /* fallback */ }
}
</script>

<style scoped>
.message-wrapper {
  display: flex;
  margin-bottom: 20px;
  animation: messageIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.message-wrapper.user { justify-content: flex-end; }

.message {
  display: flex;
  gap: 10px;
  max-width: 80%;
}

.message-wrapper.user .message {
  flex-direction: row-reverse;
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
  margin-top: 4px;
}

.avatar.user {
  background: rgba(201, 125, 96, 0.15);
}

.avatar.assistant {
  background: rgba(122, 139, 117, 0.15);
  color: var(--sage);
  font-size: 13px;
}

.bubble {
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  line-height: 1.7;
  font-size: 14px;
  word-break: break-word;
  position: relative;
}

.user .bubble {
  background: var(--text-primary);
  color: #faf8f4;
  border-bottom-right-radius: 4px;
}

.assistant .bubble {
  background: var(--bg-surface);
  color: var(--text-primary);
  border-bottom-left-radius: 4px;
  box-shadow: var(--shadow-sm);
}

.user-content {
  white-space: pre-wrap;
}

.bubble-actions {
  margin-top: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.message-wrapper:hover .bubble-actions {
  opacity: 1;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-surface);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin: 12px 0 6px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--text-primary);
}

.markdown-body :deep(h1) { font-size: 17px; }
.markdown-body :deep(h2) { font-size: 16px; }
.markdown-body :deep(h3) { font-size: 15px; }

.markdown-body :deep(p) { margin: 6px 0; }

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 6px 0;
  padding-left: 22px;
}

.markdown-body :deep(li) { margin: 3px 0; }

.markdown-body :deep(code) {
  background: rgba(44, 41, 36, 0.08);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 13px;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
}

.markdown-body :deep(pre) {
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: var(--radius-md);
  padding: 16px;
  margin: 10px 0;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.5;
}

.markdown-body :deep(pre code) {
  background: none;
  padding: 0;
  font-size: inherit;
  color: inherit;
}

.markdown-body :deep(blockquote) {
  border-left: 3px solid var(--accent);
  margin: 8px 0;
  padding: 6px 16px;
  color: var(--text-secondary);
  background: rgba(201, 125, 96, 0.06);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.markdown-body :deep(a) {
  color: var(--accent);
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  margin: 8px 0;
  font-size: 13px;
  width: 100%;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid var(--border);
  padding: 6px 10px;
  text-align: left;
}

.markdown-body :deep(th) {
  background: rgba(44, 41, 36, 0.04);
  font-weight: 600;
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--border);
  margin: 12px 0;
}

.markdown-body :deep(strong) { font-weight: 600; }

@keyframes messageIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 767px) {
  .message { max-width: 88%; }
  .bubble { padding: 10px 14px; font-size: 14px; }
}
</style>
