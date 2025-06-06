const OAuthClient = require('./OAuthClient');
const axios = require('axios');

class KickBot extends OAuthClient {
  constructor(config) {
    super(config);
  }

  async subscribeToEvents() {
    this.loadToken();
    if (this.isTokenExpired()) {
      console.log('🔄 Token expirado, renovando...');
      await this.refreshTokenIfNeeded();
    }

    const response = await axios.post('https://api.kick.com/public/v1/events/subscriptions', {
      broadcaster_user_id: this.config.broadcasterId,
      events: this.config.eventTypes.map(type => ({ name: type, version: 1 })),
      method: 'webhook'
    }, {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });
  }
}

module.exports = KickBot;