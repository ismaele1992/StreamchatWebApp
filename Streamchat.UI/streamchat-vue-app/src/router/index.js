import { createRouter, createWebHistory } from 'vue-router';
import ChatPanel from '../components/ChatPanel.vue';
import EventsPanel from '../components/EventsPanel.vue';
import DashboardView from '@/components/DashboardView.vue';

const routes = [
    { path: '/', redirect: '/dashboard' },
    { path: '/chat', component: ChatPanel },
    { path: '/events', component: EventsPanel },
    { path: '/dashboard', component: DashboardView }
]

export default createRouter({
    history: createWebHistory(),
    routes
});