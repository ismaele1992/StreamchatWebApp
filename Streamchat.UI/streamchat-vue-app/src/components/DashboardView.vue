<template>
  <div class="dashboard">
    <ChatPanel />
    <EventsPanel />
  </div>
</template>

<script setup>
import ChatPanel from '../components/ChatPanel.vue';
import EventsPanel from '../components/EventsPanel.vue';
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  padding: 1rem;
  height: calc(100vh - 48px); /* Ajuste correcto si el navbar ocupa ~48px */
  box-sizing: border-box;
}

.panel {
  display: flex;
  flex-direction: column;
  background-color: #18181b;
  padding: 1rem;
  border-radius: 8px;
  overflow: hidden;
  flex: 1; /* <-- reparto 50/50 */
  min-width: 0;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

router-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 48px); /* Igual que .dashboard */
}
</style>