<template>
  <div v-if="platform === 'Kick' && message?.payload">
    <img v-if="iconSrc" :src="iconSrc" class="platform-icon" alt="Kick Icon" />
    <div ref="username" class="user">{{ message.payload.sender?.username }}</div>
    <div class="message">: </div>
    <div
      v-for="(fragment, index) in fragments"
      :key="index"
      class="message"
    >
      <span v-if="fragment.type === 'text'" class="message">{{ fragment.text }}</span>
      <img
        v-else-if="fragment.type === 'emote'"
        :src="`${emoteSrc}/${fragment.id}/fullsize`"
        class="platform-icon"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import '../assets/styles/ChatMessage.css';

const props = defineProps({
  platform: {
    type: String,
    required: true
  },
  message: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['renderedKick']);

const iconSrc = require('../assets/icons/kickicon.png');
const emoteSrc = "https://files.kick.com/emotes";
const fragments = ref([]);
const username = ref(null);

function parseMessage() {
  if (typeof props.message?.payload?.content === 'string' && props.message.platform === 'Kick') {
    let text = props.message.payload.content;
    const regex = /(.*?)\[emote:(\d+):([^\]]+)\](.*)?/;

    while (text) {
      const match = text.match(regex);

      if (match) {
        if (match[1].trim()) {
          fragments.value.push({ type: "text", text: match[1].trim() });
        }

        const emoteId = match[2];
        const emoteName = match[3];

        fragments.value.push({ type: "emote", text: emoteName, id: emoteId });
        text = match[4] || "";
      } else {
        if (text.trim()) {
          fragments.value.push({ type: "text", text: text.trim() });
        }
        break;
      }
    }

    nextTick(() => {
      emit('renderedKick');
    });
  }
}

onMounted(() => {
  if (username.value && props.message?.payload?.sender?.identity?.username_color) {
    username.value.style.color = props.message.payload.sender.identity.username_color;
  }

  parseMessage();
});
</script>