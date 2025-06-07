import { defineStore } from 'pinia';
import axios from 'axios';

const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss' : 'ws';
const WS_HOST = window.location.hostname;
const WS_PORT = WS_PROTOCOL === 'wss' ? '8443' : '8081';
const WS_BASE_URL = `${WS_PROTOCOL}://${WS_HOST}:${WS_PORT}`;

// Base URL para HTTP/HTTPS API:
const API_PROTOCOL = window.location.protocol;
const API_BASE_URL = `${API_PROTOCOL}//${WS_HOST}`;

export const useChatStore = defineStore('chat', {
    state: () => ({
        ws: null,
        messages: [],
        events: [],
        error: null,
        ttsEnabled: false,
        last_message: null
    }),
    actions: {
        connectWebSocket() {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                console.warn("⚠️ WebSocket ya está conectado, se omite reconexión.");
                return;
            }

            this.ws = new WebSocket(WS_BASE_URL);

            this.ws.onopen = () => {
                console.log('🟢 Conectado al WebSocket');
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const eventId = data.eventId;

                    // Ignorar duplicados
                    const alreadyInMessages = this.messages.some(m => m.eventId === eventId);
                    const alreadyInEvents = this.events.some(e => e.eventId === eventId);
                    console.log("EVENT TYPE:", data.type );
                    if (data.type === "message") {
                        if (data.username?.toLowerCase() !== "nightbot" && !alreadyInMessages) {
                            this.messages.push(data);
                            this.readMessage(data);
                        }
                    } else {
                        if (!alreadyInEvents) {
                            this.events.unshift(data);
                            this.events = this.events.slice(0, 50); // limitar
                            this.readEvent(data);
                        }
                    }

                    if (eventId) {
                        this.ws.send(JSON.stringify({ type: 'ack', eventId }));
                    }

                } catch (err) {
                    console.error("❌ Error al procesar mensaje WebSocket:", err);
                    this.error = "Se ha producido un error con la conexión WebSocket.";
                }
            };

            this.ws.onerror = () => {
                this.error = "Error en WebSocket.";
            };

            this.ws.onclose = () => {
                console.log("🔴 WebSocket cerrado");
            };
        },

        async fetchLatestEvents() {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/latest-events`);
                this.events = response.data;
            } catch (error) {
                console.error('Error al obtener eventos:', error);
            }
        },

        async fetchLatestMessages(){
            try {
                const response = await axios.get(`${API_BASE_URL}/api/latest-messages`);
                this.messages = response.data;
            } catch (error) {
                console.error('Error trying to get messages:', error);
            }
        },

        toggleTTS() {
            this.ttsEnabled = !this.ttsEnabled;
            if (this.ttsEnabled) {
                const synth = window.speechSynthesis;
                const utterance = new SpeechSynthesisUtterance('Texto de prueba para activar la síntesis de voz');
                utterance.lang = 'es-ES';
                synth.cancel();
                synth.speak(utterance);
            }
        },

        readMessage(data) {
            if (!this.ttsEnabled) return;
            const synth = window.speechSynthesis;
            if (!synth) return;

            let username = data.payload?.event?.chatter_user_name;
            let message = '';

            console.log(data);
            if (data.platform === 'Twitch') {
                message = data.payload.event.message.text;
            } else if (data.platform === 'Kick') {
                username = data.payload.sender.username;
                message = data.payload.content;
            } else if (data.platform === 'Youtube') {
                username = data.message.username;
                message = data.message.message;
            }

            const text = `${username} dice: ${message}`;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-ES';
            utterance.rate = 1.0;

            if (username.toLowerCase() !== "nightbot" && this.last_message !== text) {
                synth.speak(utterance);
                this.last_message = text;
            }
        },

        readEvent(data){
            if (!this.ttsEnabled) return;
            const synth = window.speechSynthesis;
            if (!synth) return;
            console.log(data);

            let username = '';
            let message = '';

            switch(data.platform){
                case 'Twitch':
                    ({ username, message } = this.getEventTextTwitch(data));
                    break;
                case 'Kick':
                    ({ username, message } = this.getEventTextKick(data));
                    break;
                case 'Youtube':
                    break;
            }
            const text = `${username} ${message}`;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-ES';
            utterance.rate = 1.0;

            if (username.toLowerCase() !== "nightbot" && this.last_message !== text) {
                synth.speak(utterance);
                this.last_message = text;
            }
        },

        getEventTextTwitch(data){
            let username = data.event.event.user_name;
            let message = ''
            switch(data.event_type){
                case 'channel.subscribe':
                    message = `se ha suscrito.`
                    break;
                case 'channel.subscription.message':
                    message = `se ha suscrito por ${data.event.event.streak_months} meses. ${data.event.event.message.text}`;
                    break;
                case 'channel.follow':
                    message = `te ha seguido.`;
                    break;
                case 'channel.cheer':
                    message = `ha donado ${data.event.event.bits} bits. ${data.event.event.message}`;
                    break;
                case 'channel.raid':
                    username = data.event.event.from_broadcaster_user_name;
                    message = `te ha raideado con ${data.event.event.viewers} viewers.`
                    break;
                case 'channel.subscription.gift':
                    message = `ha regalado ${data.event.event.total} subscripciones. Ha regalado un total de ${data.event.event.cumulative_total} subscripciones al canal.`
                    break;
                default:
                    message = '';
                    break;
            }
            return {username, message};
        },

        getEventTextKick(data){
            let username = data.event.follower.username;
            let message =''
            switch(data.event_type){
                case 'channel.followed':
                    message = `te ha seguido.`;
                    break;
                default:
                    message = '';
                    break;
            }
            return { username, message };
        }
    }
})