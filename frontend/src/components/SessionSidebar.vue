<template>
  <template v-if="persistent">
    <div class="sidebar sidebar-persistent">
      <div class="sidebar-brand">
        <span class="brand-icon">✦</span>
        <span class="brand-text">AI 助手</span>
      </div>
      <button class="new-chat-btn" @click="$emit('new')">
        <span class="new-chat-icon">+</span>
        新对话
      </button>
      <div class="session-list">
        <div
          v-for="session in sessions"
          :key="session.id"
          class="session-item"
          :class="{ active: session.id === currentId }"
          @click="switchSession(session.id)"
        >
          <div class="session-info">
            <div class="session-title">{{ session.title || '新对话' }}</div>
            <div class="session-meta">{{ formatTime(session.updatedAt) }}</div>
          </div>
          <button
            class="delete-btn"
            @click.stop="deleteSession(session.id)"
          >✕</button>
        </div>
        <div v-if="sessions.length === 0" class="empty">暂无历史会话</div>
      </div>
    </div>
  </template>
  <template v-else>
    <div class="sidebar-overlay" v-if="visible" @click="$emit('close')"></div>
    <div class="sidebar sidebar-overlay-drawer" :class="{ open: visible }">
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <span class="brand-icon">✦</span>
          <span class="brand-text">AI 助手</span>
        </div>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      <button class="new-chat-btn mobile" @click="newChatMobile">
        <span class="new-chat-icon">+</span>
        新对话
      </button>
      <div class="session-list">
        <div
          v-for="session in sessions"
          :key="session.id"
          class="session-item"
          :class="{ active: session.id === currentId }"
          @click="switchSession(session.id)"
        >
          <div class="session-info">
            <div class="session-title">{{ session.title || '新对话' }}</div>
            <div class="session-meta">{{ formatTime(session.updatedAt) }}</div>
          </div>
          <button
            class="delete-btn"
            @click.stop="deleteSession(session.id)"
          >✕</button>
        </div>
        <div v-if="sessions.length === 0" class="empty">暂无历史会话</div>
      </div>
    </div>
  </template>
</template>

<script setup>
const props = defineProps({
  visible: Boolean,
  persistent: { type: Boolean, default: false },
  sessions: { type: Array, default: () => [] },
  currentId: { type: String, default: '' },
});

const emit = defineEmits(['close', 'switch', 'delete', 'new']);

function switchSession(id) {
  emit('switch', id);
  if (!props.persistent) emit('close');
}

function deleteSession(id) {
  if (confirm('确定删除此会话？')) {
    emit('delete', id);
  }
}

function newChatMobile() {
  emit('new');
  emit('close');
}

function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  if (d.toDateString() === now.toDateString()) {
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  return pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}
</script>

<style scoped>
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(44, 41, 36, 0.3);
  z-index: 99;
  backdrop-filter: blur(2px);
}

.sidebar {
  display: flex;
  flex-direction: column;
  background: var(--bg-sidebar);
  z-index: 100;
}

.sidebar.sidebar-persistent {
  width: 280px;
  height: 100vh;
  border-right: 1px solid var(--border);
}

.sidebar.sidebar-overlay-drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 4px 0 24px rgba(44, 41, 36, 0.15);
}

.sidebar.sidebar-overlay-drawer.open {
  transform: translateX(0);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 20px 0;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.brand-icon {
  font-size: 18px;
  color: var(--accent);
}

.brand-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  color: var(--text-muted);
  transition: color 0.15s;
}
.close-btn:hover { color: var(--text-primary); }

.new-chat-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 16px 8px;
  padding: 10px 14px;
  border: 1px dashed var(--border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.new-chat-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(201, 125, 96, 0.06);
}

.new-chat-btn.mobile {
  margin: 12px 16px;
}

.new-chat-icon {
  font-size: 16px;
  font-weight: 300;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px;
}

.session-list::-webkit-scrollbar { width: 4px; }
.session-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

.session-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 2px;
}

.session-item:hover {
  background: rgba(44, 41, 36, 0.04);
}

.session-item.active {
  background: rgba(201, 125, 96, 0.1);
}

.session-item.active .session-title {
  color: var(--accent);
}

.session-info {
  flex: 1;
  min-width: 0;
}

.session-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-meta {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.delete-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
  opacity: 0;
  transition: all 0.15s;
  border-radius: 4px;
}

.session-item:hover .delete-btn { opacity: 1; }
.delete-btn:hover { color: #c0392b; background: rgba(192, 57, 43, 0.06); }

.empty {
  text-align: center;
  color: var(--text-muted);
  padding: 32px 0;
  font-size: 13px;
}

@media (max-width: 767px) {
  .sidebar-persistent { display: none; }
}
</style>