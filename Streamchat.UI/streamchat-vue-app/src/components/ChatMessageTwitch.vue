<template>
  <div v-if="platform === 'Twitch' && message?.payload?.event">
    <img v-if="iconSrc" :src="iconSrc" class="platform-icon" alt="Twitch Icon" />
    <img
      v-for="(badge, index) in badges"
      :key="`badge-${index}`"
      :src="badge"
      class="platform-icon"
      loading="lazy"
    />
    <div ref="username" class="user">{{ message.payload.event.chatter_user_name }}</div>
    <div class="message">: </div>
    <div
      v-for="(fragment, index) in message.payload.event.message.fragments"
      :key="`fragment-${index}`"
      class="message"
    >
      <span v-if="fragment.type === 'text'" class="message">{{ fragment.text }}</span>
      <img
        v-else-if="fragment.type === 'emote'"
        :src="`${emoteSrc}/${fragment.emote.id}/${fragment.emote.format.at(-1)}/dark/2.0`"
        class="platform-icon"
        loading="lazy"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import '../assets/styles/ChatMessage.css';

const props = defineProps({
  platform: String,
  message: Object
});

const emit = defineEmits(['renderedTwitch']);

const iconSrc = require('../assets/icons/twitchicon.png');
const emoteSrc = 'https://static-cdn.jtvnw.net/emoticons/v2/';
const username = ref(null);
const badges = ref([]);

let allTwitchBadges = null;

async function loadBadges() {
  if (!allTwitchBadges) {
    try {
      const response = await axios.get('http://192.168.2.50/api/all-badges');
      allTwitchBadges = response.data;
    } catch (err) {
      console.error('❌ No se pudieron obtener las badges:', err.message);
      return;
    }
  }

  const userBadges = props.message?.payload?.event?.badges;
  if (!Array.isArray(userBadges)) return;

  const resolved = [];

  for (const b of userBadges) {
    const setName = b.set_id;
    const versionId = b.id;
    const badgeSet = allTwitchBadges.find(set => set.name === setName);
    const badgeVersion = badgeSet?.versions?.find(v => v.id === versionId);
    if (badgeVersion?.image_url_4x) {
      resolved.push(badgeVersion.image_url_4x);
    }
  }

  badges.value = resolved;
}

onMounted(async () => {
  if (username.value && props.message?.payload?.event?.color) {
    username.value.style.color = props.message.payload.event.color;
  }

  await loadBadges();
  emit('renderedTwitch');
});
</script>