<template>
    <div v-if="platform==='Youtube'">
        <img v-if="iconSrc" :src="iconSrc" class="platform-icon" alt="Youtube Icon"/>
        <img v-show="!loading" :src="message.photo" class="youtube-icon" alt="User Image" @load="onImageLoad"/>
        <div ref="username" class="user">{{ message.username }}</div>
        <span class="message">: {{ message.message }}</span>
    </div>
</template>

<script>
import '../assets/styles/ChatMessage.css'

export default {
    name: 'ChatMessageYoutube',
    props: {
        platform: {
            type: String,
            required: true
        },
        message: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            loading: true,
            iconSrc: require('../assets/icons/youtubeicon.png')
        }
    },
    mounted(){
        const usernameElement = this.$refs.username;

        if (usernameElement){
            usernameElement.style.color = this.message.color;
        }
    },
    methods: {
        onImageLoad() {
            this.loading = false;
            console.log(this.loading);
        }
    }
}

</script>

<style scoped>
.user {
    font-weight: 700;
    font-size: 15px;
    color: #000000;
    display: inline;
    height: 100%;
    background-color: #fcf305; /* Yellow background */
    border-radius: 2px; /* Small rounded corners */
    padding: 2px 5px;
}
</style>