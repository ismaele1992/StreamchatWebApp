const { MongoClient } = require('mongodb');

class TwitchBadgeRepository {
  constructor() {
    this.client = new MongoClient('mongodb://localhost:27017');
    this.dbName = 'streamchat';
  }

  async connect() {
    if (!this.client.isConnected?.()) await this.client.connect();
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection('badges');
  }

  async clearBadges() {
    await this.collection.deleteMany({});
  }

  async saveBadges(badges, platform = 'Twitch') {
    if (!badges || badges.length === 0) {
      console.log('⚠️ No hay badges para guardar.');
      return;
    }

    const docs = badges.map(b => ({
      platform,
      name: b.set_id,           // <- esto lo necesita el frontend
      ...b,                     // <- para conservar el resto como antes (versions, etc.)
      received_at: new Date().toISOString()
    }));

    await this.collection.insertMany(docs);
  }

  async getBadges() {
    return await this.collection.find({ platform: 'Twitch' }).toArray();
  }

  async close() {
    await this.client.close();
  }
}

module.exports = TwitchBadgeRepository;