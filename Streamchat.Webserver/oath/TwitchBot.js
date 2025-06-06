const OAuthClient = require('./OAuthClient');
const axios = require('axios');
const fs = require('fs');
const qs = require('qs');

class TwitchBot extends OAuthClient {
  constructor(config) {
    super(config);
    this.appTokenFile = config.appTokenFile || 'TwitchToken.json';
    this.appAccessToken = '';
    this.appAccessTokenExpiresAt = null;
  }

  loadAppToken() {
    if (!fs.existsSync(this.appTokenFile)) return null;
    const data = JSON.parse(fs.readFileSync(this.appTokenFile));
    this.appAccessToken = data.access_token;
    this.appAccessTokenExpiresAt = data.expires_at;
    return data;
  }

  isAppTokenExpired() {
    return !this.appAccessTokenExpiresAt || Date.now() >= this.appAccessTokenExpiresAt;
  }

  async getAppAccessToken() {
    const response = await axios.post(this.config.tokenUrl, qs.stringify({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: 'client_credentials'
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    this.appAccessToken = response.data.access_token;
    this.appAccessTokenExpiresAt = Date.now() + response.data.expires_in * 1000;

    fs.writeFileSync(this.appTokenFile, JSON.stringify({
      access_token: this.appAccessToken,
      expires_at: this.appAccessTokenExpiresAt
    }, null, 2));

    return this.appAccessToken;
  }

  async subscribeToEvents() {
    const appAccessToken = await this.getAppAccessToken();
    if (!appAccessToken) throw new Error("App access token no cargado");

    const tokenData = this.loadToken();
    if (!tokenData) {
      throw new Error("❌ No se encontró token de usuario.");
    }

    if (this.isTokenExpired()) {
      console.log("🔄 Token de usuario expirado. Renovando...");
      await this.refreshTokenIfNeeded();
    }

    const userAccessToken = this.accessToken;

    const events = [
      { type: 'channel.follow', version: '2', useUserToken: true },
      { type: 'channel.subscribe', version: '1' },
      { type: 'channel.subscription.message', version: '1' },
      { type: 'channel.cheer', version: '1' },
      { type: 'channel.raid', version: '1' },
      { type: 'channel.chat.message', version: '1' }
    ];

    const conditionsMap = {
      'channel.raid': {
        to_broadcaster_user_id: this.config.broadcasterId.toString()
      },
      'channel.chat.message': {
        broadcaster_user_id: this.config.broadcasterId.toString(),
        user_id: this.config.broadcasterId.toString()
      },
      'channel.follow': {
        broadcaster_user_id: this.config.broadcasterId.toString(),
        moderator_user_id: this.config.broadcasterId.toString()
      }
    };

    for (const event of events) {
      const condition = conditionsMap[event.type] || {
        broadcaster_user_id: this.config.broadcasterId.toString()
      };

      const token = event.useUserToken ? userAccessToken : appAccessToken;

      try {
        const res = await axios.post('https://api.twitch.tv/helix/eventsub/subscriptions', {
          type: event.type,
          version: event.version,
          condition,
          transport: {
            method: 'webhook',
            callback: 'https://unterstadistycs.sytes.net/api/twitchwebhook',
            secret: 'TuSecretoSeguro'
          }
        }, {
          headers: {
            'Client-ID': this.config.clientId,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log(`✅ Subscrito a ${event.type}`);
      } catch (err) {
        console.error(`❌ Error al suscribirse a ${event.type}:`, err.response?.data || err.message);
      }
    }
  }
}

module.exports = TwitchBot;