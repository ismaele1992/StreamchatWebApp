<template>
  <div class="panel chat-panel">
    <h3 class="chat-title">Chat</h3>
    <div class="scroll-container" ref="scrollContainer" @scroll="onScroll">
      <div v-if="!initialized" class="loading">Cargando chat...</div>
      <div v-else-if="store.error" class="error">{{ store.error }}</div>
      <div v-else>
        <div
          class="message-box"
          v-for="(message, index) in store.messages"
          :key="message.eventId || index"
        >
          <ChatMessageYoutube :platform="message.platform" :message="message" />
          <ChatMessageKick :platform="message.platform" :message="message" />
          <ChatMessageTwitch :platform="message.platform" :message="message" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue';
import { useChatStore } from '../stores/useChatStore';
import ChatMessageTwitch from './ChatMessageTwitch.vue';
import ChatMessageKick from './ChatMessageKick.vue';
import ChatMessageYoutube from './ChatMessageYoutube.vue';

const store = useChatStore();
const scrollContainer = ref(null);
const isUserAtBottom = ref(true);
const initialized = ref(false); // 🔁 Estado de carga
const hideScrollTimeout = ref(null);

function onScroll() {
  const el = scrollContainer.value;
  if (!el) return;
  const threshold = 30;
  isUserAtBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
}

function scrollToBottom() {
  const el = scrollContainer.value;
  if (el) {
    el.scrollTop = el.scrollHeight;
  }
}

function handleScroll() {
  const el = scrollContainer.value;
  if (!el) return;
  el.classList.add('show-scrollbar');
  clearTimeout(hideScrollTimeout.value);
  hideScrollTimeout.value = setTimeout(() => {
    el.classList.remove('show-scrollbar');
  }, 1000);
}

onMounted(async () => {
  store.connectWebSocket();
  await store.fetchLatestMessages();
  initialized.value = true;
  nextTick(scrollToBottom);

  const el = scrollContainer.value;
  if (el) {
    el.addEventListener('wheel', handleScroll);
    el.addEventListener('scroll', handleScroll);
  }
});

onBeforeUnmount(() => {
  const el = scrollContainer.value;
  if (el) {
    el.removeEventListener('wheel', handleScroll);
    el.removeEventListener('scroll', handleScroll);
  }
});

watch(
  () => store.messages.length,
  async () => {
    await nextTick();
    if (isUserAtBottom.value) {
      scrollToBottom();
    }
  }
);
</script>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 48px);
  flex: 1;
  min-width: 0;
}

.chat-title {
  font-size: 1.2rem;
  margin: 0;
  padding-bottom: 0.5rem;
  color: #ffffff;
}

.scroll-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  scrollbar-width: thin; /* Firefox */
  scrollbar-color: transparent transparent; /* Firefox */
}

/* WebKit scrollbar oculta por defecto */
.scroll-container::-webkit-scrollbar {
  width: 6px;
}

/* Oculta el pulgar */
.scroll-container::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 3px;
  transition: background-color 0.3s ease;
}

/* Aparece con clase especial */
.scroll-container.show-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.3);
}

.scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

.message-box {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.25rem 0;
}

.loading {
  color: #ccc;
  padding: 1rem;
  text-align: center;
}

.panel {
  display: flex;
  flex-direction: column;
  background-color: #18181b;
  padding: 1rem;
  border-radius: 8px;
  overflow: hidden; /* ESTE es el valor correcto */
  flex: 1;
  min-width: 0;
}
</style>