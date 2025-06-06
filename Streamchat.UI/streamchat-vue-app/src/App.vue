<template>
  <div class="app-container">
    <nav class="navbar">
      <div class="nav-left">
        <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
        <router-link to="/chat" class="nav-link">Chat</router-link>
        <router-link to="/events" class="nav-link">Events</router-link>
      </div>
      <div class="nav-right">
        <button class="side-button" @click="store.toggleTTS">
          {{ store.ttsEnabled ? 'Desactivar TTS' : 'Activar TTS' }}
        </button>
      </div>
    </nav>

    <router-view />
  </div>
</template>

<script setup>
import { useChatStore } from './stores/useChatStore';
const store = useChatStore();
</script>

<style scoped>
.app-container {
  background-color: #0e0e10;
  color: white;
  min-height: 100vh;
  font-family: 'Inter', 'Segoe UI', sans-serif;
}

.navbar {
  background-color: #18181b;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  height: 48px;
  border-bottom: 1px solid #2c2f33;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 1.75rem;
}

.nav-right {
  margin-left: auto;
}

.nav-link {
  all: unset;
  color: #efeff1;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s ease;
  text-decoration: none;
  padding: 4px 0;
}

.nav-link:hover {
  color: white;
  text-decoration: none;
}

.router-link-exact-active.nav-link {
  color: white;
  font-weight: 600;
  text-decoration: none;
}

/* Estilo tipo Twitch para los enlaces */
.nav-link {
  color: #efeff1;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s ease;
  padding: 4px 0;
  cursor: pointer;
}

.nav-link:hover {
  color: white;
}

/* Enlace activo: solo color blanco y un poco más de peso */
.router-link-exact-active {
  color: white;
  font-weight: 600;
}

/* Botón estilo Twitch */
.side-button {
  background-color: #9147ff;
  color: white;
  font-weight: bold;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: background-color 0.2s ease;
}

.side-button:hover {
  background-color: #772ce8;
}

</style>