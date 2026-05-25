<template>
  <div class="input-area">
    <div class="input-wrapper">
      <textarea
        ref="textareaRef"
        v-model="text"
        class="input"
        :placeholder="disabled ? 'AI 正在回复...' : '输入消息，Enter 发送，Ctrl+Enter 换行'"
        :disabled="disabled"
        rows="1"
        @keydown="handleKeydown"
        @input="autoResize"
      />
      <div class="actions">
        <button v-if="disabled" class="btn btn-stop" @click="$emit('stop')">
          ⏹ 停止
        </button>
        <button
          v-else
          class="btn btn-send"
          :disabled="!text.trim()"
          @click="send"
        >
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['send', 'stop']);
defineProps({ disabled: Boolean });

const text = ref('');
const textareaRef = ref(null);

function autoResize() {
  const el = textareaRef.value;
  if (el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
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
  border-top: 1px solid #e8e8e8;
  padding: 12px 16px;
  background: #fff;
}
.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  max-width: 800px;
  margin: 0 auto;
}
.input {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  outline: none;
  font-family: inherit;
  max-height: 120px;
  transition: border-color 0.2s;
}
.input:focus {
  border-color: #667eea;
}
.input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}
.actions {
  flex-shrink: 0;
}
.btn {
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-send {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
}
.btn-send:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}
.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-stop {
  background: #ff4757;
  color: #fff;
}
.btn-stop:hover {
  background: #e84142;
}
</style>
