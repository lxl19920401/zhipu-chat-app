<template>
  <div class="message-wrapper" :class="role">
    <div class="message">
      <div class="avatar">{{ role === 'user' ? '👤' : '🤖' }}</div>
      <div class="bubble">
        <div v-if="role === 'user'" class="content">{{ content }}</div>
        <div v-else class="content markdown-body" v-html="renderedContent"></div>
        <div v-if="role === 'assistant' && content" class="actions">
          <button class="action-btn" @click="copyContent" :title="copied ? '已复制' : '复制'">
            {{ copied ? '✓' : '📋' }}
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
  margin-bottom: 16px;
  animation: fadeIn 0.3s ease;
}
.message-wrapper.user {
  justify-content: flex-end;
}
.message {
  display: flex;
  gap: 8px;
  max-width: 80%;
}
.message-wrapper.user .message {
  flex-direction: row-reverse;
}
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  background: #f0f0f0;
}
.bubble {
  padding: 10px 14px;
  border-radius: 14px;
  line-height: 1.6;
  font-size: 14px;
  word-break: break-word;
  position: relative;
}
.user .bubble {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border-bottom-right-radius: 4px;
}
.assistant .bubble {
  background: #f0f0f0;
  color: #333;
  border-bottom-left-radius: 4px;
}
.user .content {
  white-space: pre-wrap;
}
.actions {
  margin-top: 6px;
  display: flex;
  gap: 4px;
}
.action-btn {
  background: #e8e8e8;
  border: none;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}
.action-btn:hover {
  background: #ddd;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin: 12px 0 6px;
  font-weight: 600;
  line-height: 1.3;
}
.markdown-body :deep(h1) { font-size: 18px; }
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
  background: #e3e3e3;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 13px;
  font-family: 'Consolas', 'Monaco', monospace;
}
.markdown-body :deep(pre) {
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 8px;
  padding: 14px;
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
  border-left: 3px solid #667eea;
  margin: 8px 0;
  padding: 6px 14px;
  color: #666;
  background: rgba(102, 126, 234, 0.06);
  border-radius: 0 6px 6px 0;
}
.markdown-body :deep(a) {
  color: #667eea;
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
  border: 1px solid #ddd;
  padding: 6px 10px;
  text-align: left;
}
.markdown-body :deep(th) {
  background: #e8e8e8;
  font-weight: 600;
}
.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid #ddd;
  margin: 12px 0;
}
.markdown-body :deep(strong) { font-weight: 600; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
