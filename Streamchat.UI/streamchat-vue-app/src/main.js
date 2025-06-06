import { createApp } from 'vue';
import App from './App.vue';
import router from './router';         // 👈 Aquí importas tu router
import { createPinia } from 'pinia';

import './assets/main.css';

const app = createApp(App);
app.use(createPinia());               // Store
app.use(router);                      // Router
app.mount('#app');                    // Monte la app