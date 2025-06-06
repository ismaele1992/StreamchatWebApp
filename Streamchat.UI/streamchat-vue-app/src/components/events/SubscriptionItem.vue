<template>
  <div class="event-box">
    <div class="event-header">
      <img class="platform-icon" :src="platformIcon" alt="platform" />
      <img class="avatar" :src="avatar" alt="avatar" />
      <span class="username">{{ username }}</span>
      <span class="separator">•</span>
      <span class="event-type">{{ eventType }}</span>
    </div>
    <div class="timestamp">{{ formatDate(timestamp) }}</div>
  </div>
</template>

<script setup>

defineProps({
  username: String,
  eventType: String, // ej. "Subscribed - Prime"
  avatar: String, // URL del avatar
  platformIcon: String, // URL del icono de Twitch, Kick, etc.
  timestamp: String, // ej. "01/06/2025 14:30:25"
});

function formatDate(isoString) {
  const date = new Date(isoString);
  const pad = (n) => n.toString().padStart(2, '0');

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1); // los meses van de 0 a 11
  const year = date.getFullYear();

  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}
</script>

<style scoped>
.event-box {
  background-color: transparent; /* sin fondo */
  padding: 0.5rem 0rem 0.5rem 0; /* sin padding a la izquierda */
  color: #ffffff;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-bottom: 1px solid #2c2f33; /* línea divisoria inferior */
}

.event-header {
  display: flex;
  align-items: center;
  gap: 2px; /* reducido aún más */
  font-size: 14px;
  line-height: 1.2;
}

.platform-icon {
  display: block; /* elimina espacio extra inline */
  width: 18px;
  height: 18px;
  margin: 0;
  padding: 0;
}
.avatar {
  display: block; /* elimina espacio extra inline */
  width: 18px;
  height: 18px;
  margin: 0;
  padding: 0;
  margin-right: 6px;
}

.username {
  font-weight: 600;
}

.separator {
  font-weight: bold;
  color: #ccc;
}

.event-type {
  font-weight: 600;
}

.timestamp {
  font-size: 13px;
  color: #bcbcbc;
  padding-left: 45px; /* alineado con el contenido */
}
</style>