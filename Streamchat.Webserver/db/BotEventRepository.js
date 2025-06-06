const { MongoClient } = require('mongodb');

class BotEventRepository {
  constructor(uri = 'mongodb://localhost:27017', dbName = 'streamchat') {
    this.client = new MongoClient(uri);
    this.dbName = dbName;
  }

  async connect(collection) {
    if (!this.client.isConnected?.()) {
      await this.client.connect();
    }
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection(collection);
  }

  storeChatMessage(message, collectionName = 'messages') {
    const collection = this.db.collection(collectionName);
    collection.insertOne(message);
  }

  storeGenericEvent(event, collectionName = 'events') {
    const collection = this.db.collection(collectionName);
    collection.insertOne(event);
  }

  async getLatestEvents() {
    const events = await this.collection
      .find({})
      .sort({ received_at: -1})
      .limit(50)
      .toArray();
    return events;
  }

  async getLatestMessages() {
    const messages = await this.collection
      .find({})
      .sort({ received_at: -1 })
      .limit(100)
      .toArray();
    return messages;
  }

  async close() {
    await this.client.close();
  }
}

module.exports = BotEventRepository;