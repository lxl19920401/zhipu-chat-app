<template>
  <div class="sidebar-overlay" v-if="visible" @click="$emit('close')"></div>
  <div class="sidebar" :class="{ open: visible }">
    <div class="sidebar-header">
      <h2>历史会话</h2>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>
    <div class="session-list">
      <div
        v-for="session in sessions"
        :key="session.id"
        class="session-item"
        :class="{ active: session.id === currentId }"
        @click="switchSession(session.id)"
      >
        <div class="session-title">{{ session.title || '新对话' }}</div>
        <div class="session-meta">{{ formatTime(session.updatedAt) }}</div>
        <button
          class="delete-btn"
          @click.stop="deleteSession(session.id)"
          title="删除"
        >✕</button>
      </div>
      <div v-if="sessions.length === 0" class="empty">暂无历史会话</div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  visible: Boolean,
  sessions: { type: Array, default: () => [] },
  currentId: { type: String, default: '' },
});

const emit = defineEmits(['close', 'switch', 'delete']);

function switchSession(id) {
  emit('switch', id);
  emit('close');
}

function deleteSession(id) {
  if (confirm('确定删除此会话？')) {
    emit('delete', id);
  }
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
  background: rgba(0,0,0,0.3);
  z-index: 99;
}
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  background: #fff;
  z-index: 100;
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform 0.25s ease;
  box-shadow: 2px 0 12px rgba(0,0,0,0.1);
}
.sidebar.open {
  transform: translateX(0);
}
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
}
.sidebar-header h2 {
  font-size: 16px;
  font-weight: 600;
}
.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  color: #999;
}
.close-btn:hover { color: #333; }
.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}
.session-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  margin-bottom: 2px;
}
.session-item:hover {
  background: #f0f0f0;
}
.session-item.active {
  background: #e8ecf8;
}
.session-title {
  flex: 1;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.session-meta {
  font-size: 11px;
  color: #999;
  flex-shrink: 0;
}
.delete-btn {
  background: none;
  border: none;
  color: #ccc;
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
  opacity: 0;
  transition: all 0.15s;
}
.session-item:hover .delete-btn {
  opacity: 1;
}
.delete-btn:hover {
  color: #e74c3c;
}
.empty {
  text-align: center;
  color: #999;
  padding: 40px 0;
  font-size: 14px;
}
</style>
