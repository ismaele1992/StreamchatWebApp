<template>
  <div class="event-box">
    <div class="event-header">
      <img class="platform-icon" :src="getPlatformIcon(platformIcon)" alt="platform" />
      <img class="avatar" :src="avatar" alt="avatar" />
      <div class="event-info">
        <span class="username">{{ username }}</span>
        <span class="separator">•</span>
        <span class="event-type">Followed you</span>
      </div>
    </div>
    <div class="timestamp">
      {{ formatDate(timestamp) }}
    </div>
  </div>
</template>

<script setup>
import twitchicon from '../../assets/icons/twitchicon.png'
import kickicon from '../../assets/icons/kickicon.png'

defineProps({
  username: String,
  avatar: String,
  platformIcon: String,
  timestamp: String,
});

function getPlatformIcon(platform){
    console.log(platform);
    if (platform === "Twitch") return twitchicon;
    return kickicon;
}

function formatDate(isoString) {
  const date = new Date(isoString);
  const pad = (n) => n.toString().padStart(2, '0');

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}
</script>

<style scoped>
.event-box {
  background-color: transparent;
  padding: 0.5rem 0 0.5rem 0;
  color: #ffffff;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-bottom: 1px solid #2c2f33;
}

.event-header {
  display: flex;
  align-items: center;
  font-size: 14px;
  line-height: 1.2;
  flex-wrap: nowrap;
}

.platform-icon {
  width: 18px;
  height: 18px;
  margin-right: 2px;
}

.avatar {
  width: 18px;
  height: 18px;
  margin-right: 6px;
}

.event-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.username {
  font-weight: 600;
  white-space: nowrap;
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
  padding-left: 45px;
}
</style>