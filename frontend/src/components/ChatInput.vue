<template>
  <div class="input-area">
    <div class="input-wrapper">
      <textarea
        ref="textareaRef"
        v-model="text"
        class="input"
        :placeholder="inputPlaceholder"
        :disabled="disabled"
        rows="1"
        @keydown="handleKeydown"
        @input="autoResize"
      />
      <button
        v-if="disabled"
        class="btn btn-stop"
        @click="$emit('stop')"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="10" height="10" rx="2" fill="currentColor"/></svg>
        停止
      </button>
      <button
        v-else
        class="btn btn-send"
        :class="{ active: text.trim() }"
        :disabled="!text.trim()"
        @click="send"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7L13 1L7 13L5 9L1 7Z" fill="currentColor"/></svg>
        发送
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({ disabled: Boolean });
const emit = defineEmits(['send', 'stop']);

const text = ref('');
const textareaRef = ref(null);

const inputPlaceholder = computed(() => {
  if (props.disabled) return 'AI 正在回复...'
  return window.innerWidth < 768 ? '输入消息' : '输入消息，Enter 发送，Ctrl+Enter 换行'
})

function autoResize() {
  const el = textareaRef.value;
  if (el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
    e.preventDefault();
    send();
  }
}

function send() {
  const msg = text.value.trim();
  if (!msg) return;
  emit('send', msg);
  text.value = '';
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto';
  }
}
</script>

<style scoped>
.input-area {
  padding: 12px 20px 20px;
}

.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 4px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-wrapper:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(201, 125, 96, 0.12);
}

.input {
  flex: 1;
  border: none;
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
  font-family: inherit;
  max-height: 160px;
  background: transparent;
  color: var(--text-primary);
}

.input::placeholder {
  color: var(--text-muted);
}

.input:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  border-radius: var(--radius-sm);
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-send {
  background: var(--border);
  color: var(--text-muted);
}

.btn-send.active {
  background: var(--accent);
  color: #fff;
}

.btn-send.active:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.btn-send:disabled {
  cursor: not-allowed;
}

.btn-stop {
  background: rgba(192, 57, 43, 0.08);
  color: #c0392b;
}

.btn-stop:hover {
  background: rgba(192, 57, 43, 0.14);
}

@media (max-width: 767px) {
  .input-area {
    padding: 8px 12px 12px;
  }
  .input {
    font-size: 16px;
  }
}
</style>
