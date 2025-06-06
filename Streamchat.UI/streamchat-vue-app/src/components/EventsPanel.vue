<template>
    <div class="panel events-panel">
    <h3 class="events-title">Events</h3>
    <div class="events-content" ref="eventsContentRef">
      <div v-for="(event, index) in filteredEvents" :key="index">
        <SubscriptionItem 
          v-if="event.event_type === 'channel.subscribe'"
          :platformIcon="twitchIcon"
          :avatar="getSubscriberAvatar(event)"
          :username="event.event.event.user_name"
          :timestamp="event.received_at"
          eventType="Subscribed"
        />
        
        <ResubscriptionItem 
          v-if="event.event_type === 'channel.subscription.message'"
          :platformIcon="twitchIcon"
          :avatar="getSubscriberAvatar(event)"
          :username="event.event.event.user_name"
          :timestamp="event.received_at"
          :months="event.event.event.cumulative_months"
          :message="event.event.event.message?.text"
          :tier="displayTier(event)"
        />

        <FollowItem
          v-if="event.event_type === 'channel.follow'"
          :platformIcon="event.platform"
          :username="event.event.event.user_name"
          :avatar="followicon"
          :timestamp="event.received_at"
        />

        <FollowItem
          v-if="event.event_type === 'channel.followed'"
          :platformIcon="event.platform"
          :username="event.event.follower?.username"
          :avatar="followicon"
          :timestamp="event.received_at"
        />

        <CheerItem
          v-if="event.event_type === 'channel.cheer'"
          :platform-icon="twitchIcon"
          :avatar="getBitsAvatar(Number(event.event.event.bits))"
          :username="event.event.event.user_name"
          :timestamp="event.received_at"
          :message="event.event.event.message"
          :bits="Number(event.event.event.bits)"/>

        <GiftedSubscriptionItem
          v-if="event.event_type === 'channel.subscription.gift'"
          :platform-icon="twitchIcon"
          :avatar="getGiftedSubscriptionsAvatar(Number(event.event.event.total))"
          :username="event.event.event.user_name"
          :timestamp="event.received_at"
          :giftedCount="event.event.event.total"
          :totalGifted="event.event.event.cumulative_total"   
        />

        <RaidItem
          v-if="event.event_type === 'channel.raid'"
          :platform-icon="twitchIcon"
          :avatar="raidicon"
          :username="event.event.event.from_broadcaster_user_name"
          :timestamp="event.received_at"
          :viewerCount="event.event.event.viewers"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch, nextTick, ref, computed } from 'vue';
import { useChatStore } from '../stores/useChatStore';
import SubscriptionItem from './events/SubscriptionItem.vue';
import ResubscriptionItem from './events/ResubscriptionItem.vue';
import FollowItem from './events/FollowItem.vue';
import CheerItem from './events/CheerItem.vue';
import GiftedSubscriptionItem from './events/GiftedSubscriptionItem.vue';
import RaidItem from './events/RaidItem.vue';

import twitchIcon from '../assets/icons/twitchicon.png';

import channel0months from '../assets/icons/0months.png'
import channel3months from '../assets/icons/3months.png'
import channel6months from '../assets/icons/6months.png'
import channel9months from '../assets/icons/9months.png'
import channel12months from '../assets/icons/12months.png'
import channel24months from '../assets/icons/24months.png'

import bits1 from '../assets/icons/1bits.png';
import bits100 from '../assets/icons/100bits.png';
import bits1k from '../assets/icons/1kbits.png';
import bits5k from '../assets/icons/5kbits.png';
import bits10k from '../assets/icons/10kbits.png';
import bits25k from '../assets/icons/25kbits.png';

import followicon from '../assets/icons/followicon.svg'
import raidicon from '../assets/icons/raidicon.svg'

const store = useChatStore();
const eventsContentRef = ref(null);
let hideScrollTimeout = null;



function getBitsAvatar(bits){
    if (bits < 100){
        return bits1; 
    }
    if (bits < 1000){
      return bits100;
    }
    if (bits < 5000){
      return bits1k;
    }
    if (bits < 10000){
      return bits5k;
    }
    if (bits < 25000){
      return bits10k;
    }
    return bits25k;
}

function getSubscriberAvatar(event){
  const months = event?.event?.event?.cumulative_months ?? 0;
  if (months >= 24) return channel24months;
  if (months >= 12) return channel12months;
  if (months >= 9) return channel9months;
  if (months >= 6) return channel6months;
  if (months >= 3) return channel3months;
  return channel0months;
}

function getGiftedSubscriptionsAvatar(amount){
  if (amount < 5) return 'https://static-cdn.jtvnw.net/badges/v1/a5ef6c17-2e5b-4d8f-9b80-2779fd722414/3';
  if (amount < 10) return 'https://static-cdn.jtvnw.net/badges/v1/ee113e59-c839-4472-969a-1e16d20f3962/3';
  if (amount < 25) return 'https://static-cdn.jtvnw.net/badges/v1/d333288c-65d7-4c7b-b691-cdd7b3484bf8/3';
  if (amount < 50) return 'https://static-cdn.jtvnw.net/badges/v1/052a5d41-f1cc-455c-bc7b-fe841ffaf17f/3';
  if (amount < 100) return 'https://static-cdn.jtvnw.net/badges/v1/c4a29737-e8a5-4420-917a-314a447f083e/3';
  if (amount < 150) return 'https://static-cdn.jtvnw.net/badges/v1/8343ada7-3451-434e-91c4-e82bdcf54460/3';
  if (amount < 200) return 'https://static-cdn.jtvnw.net/badges/v1/514845ba-0fc3-4771-bce1-14d57e91e621/3'; 
  return 'https://static-cdn.jtvnw.net/badges/v1/c6b1893e-8059-4024-b93c-39c84b601732/3';
}

function displayTier(event){
  const tier = event?.event?.event?.tier;
  if (tier === "1000") return "Tier 1";
  if (tier === "2000") return "Tier 2";
  if (tier === "3000") return "Tier 3";
  return "Prime";
}

function handleScroll() {
  const el = eventsContentRef.value;
  if (!el) return;
  el.classList.add('show-scrollbar');
  clearTimeout(hideScrollTimeout);
  hideScrollTimeout = setTimeout(() => {
    el.classList.remove('show-scrollbar');
  }, 1000);
}

// 🎯 Filtrar eventos duplicados
const filteredEvents = computed(() => {
  const seenUsers = new Set();
  const result = [];

  for (const event of store.events) {
    const user = event?.event?.event?.user_name;
    const type = event.event_type;

    if (type === 'channel.subscription.message') {
      seenUsers.add(user);
      result.push(event);
    } else if (type === 'channel.subscribe') {
      if (!seenUsers.has(user)) {
        result.push(event);
      }
    } else {
      result.push(event);
    }
  }

  return result;
});

onMounted(async () => {
  await store.fetchLatestEvents();
  const el = eventsContentRef.value;
  if (el) {
    el.addEventListener('wheel', handleScroll);
    el.addEventListener('scroll', handleScroll);
  }
});

onBeforeUnmount(() => {
  const el = eventsContentRef.value;
  if (el) {
    el.removeEventListener('wheel', handleScroll);
    el.removeEventListener('scroll', handleScroll);
  }
});

watch(() => store.events.length, async () => {
  await nextTick();
});
</script>

<style scoped>
.events-panel {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 48px); /* ESTE es el cambio clave */
  flex: 1;
  min-width: 0;
}

.events-title {
  font-size: 1.2rem;
  margin: 0;
  padding-bottom: 0.5rem;
  color: #ffffff;
}

.events-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  scrollbar-width: thin; /* Firefox */
  scrollbar-color: transparent transparent; /* Firefox */
}

/* WebKit scrollbar oculta por defecto */
.events-content::-webkit-scrollbar {
  width: 6px;
}

/* Oculta el pulgar */
.events-content::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 3px;
  transition: background-color 0.3s ease;
}

/* Aparece con clase especial */
.events-content.show-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.3);
}

.events-content::-webkit-scrollbar-track {
  background: transparent;
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
</style>