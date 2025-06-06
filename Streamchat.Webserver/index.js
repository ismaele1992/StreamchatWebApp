const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const KickBot = require('./oath/KickBot');
const TwitchBot = require('./oath/TwitchBot');
const BotEventRepository = require('./db/BotEventRepository');
const botEventRepository = new BotEventRepository();
const EventDispatcher = require('./eventdispatcher/EventDispatcher');
const eventDispatcher = new EventDispatcher();
const TwitchBadgeRepository = require('./db/TwitchBadgeRepository');
const axios = require('axios');
const cors = require('cors');
app.use(cors());

// Ruta absoluta al archivo de configuración
const configPath = path.resolve(__dirname, 'app.config.json');

// Leer y parsear el archivo JSON
const rawConfig = fs.readFileSync(configPath, 'utf8');
const configJson = JSON.parse(rawConfig);

const config = {
    Kick: {
        clientId: configJson.Kick.ClientId,
        clientSecret: configJson.Kick.ClientSecret,
        broadcasterId: configJson.Kick.BroadcasterId,
        redirectUri: configJson.Kick.RedirectUri,
        authUrl: 'https://id.kick.com/oauth/authorize',
        tokenUrl: 'https://id.kick.com/oauth/token',
        scopes: configJson.Kick.Scopes,
        eventTypes: configJson.Kick.EventTypes,
        tokenFile: "KickToken.json"
    },
    Twitch: {
        platform: configJson.Twitch.Platform,
        server: configJson.Twitch.Server,
        port: configJson.Twitch.Port,
        clientId: configJson.Twitch.ClientId,
        clientSecret: configJson.Twitch.ClientSecret,
        username: configJson.Twitch.Username,
        oauthToken: configJson.Twitch.OauthToken,
        refreshToken: configJson.Twitch.RefreshToken,
        accessToken: configJson.Twitch.AccessToken,
        broadcasterId: configJson.Twitch.BroadcasterId,
        redirectUri: configJson.Twitch.RedirectUri, // si usas URL aquí
        authUrl: 'https://id.twitch.tv/oauth2/authorize',
        tokenUrl: 'https://id.twitch.tv/oauth2/token',
        scopes: configJson.Twitch.Scopes || ['user:read:email'],
        tokenFile: 'TwitchToken.json',
        globalBadgesUrl: configJson.Twitch.GlobalBadgesUrl,
        streamerBadgesUrl: configJson.Twitch.StreamerBadgesUrl
  }
};

const badgeRepo = new TwitchBadgeRepository();

// --- Servidor Express para Webhooks ---
const PORT = 443;
let cachedBadges = [];

app.use(bodyParser.json());

app.get('/', (_, res) => {
    res.status(200).send('OK');
});

app.post('/api/kickwebhook', async(req, res) => {
  const eventType = req.headers['kick-event-type'] || 'Unknown Event';
  const payload = req.body;
  console.log(`[Kick] - Event: ${eventType}`);
  if (eventType === "chat.message.sent"){
    const message = normalizeMessage(payload, "Kick");
    eventDispatcher.sendEvent(message, "message", "Kick");
    botEventRepository.storeChatMessage(message);
  }
  else {
    const event = normalizeEvent(payload, eventType, "Kick");
    eventDispatcher.sendEvent(event, "event", "Kick");
    botEventRepository.storeGenericEvent(event);
  }
  res.status(200).send('OK');
});

app.post('/api/twitchwebhook', async(req, res) => {
  const payload = req.body;
  const eventType = req.headers['twitch-eventsub-message-type'] || 'Unknown Event';
  const subscriptionType = req.headers['twitch-eventsub-subscription-type'];
  if (eventType === 'webhook_callback_verification'){
      console.log(`[Twitch] - Event: Challenge received`);
      return res.status(200).send(req.body.challenge);
    }
  switch(subscriptionType) {    
    case 'channel.chat.message':
        const message = normalizeMessage(payload, "Twitch");
        eventDispatcher.sendEvent(message, "message", "Twitch");
        botEventRepository.storeChatMessage(message);
        break;
    default:
        const event = normalizeEvent(payload, subscriptionType, "Twitch");
        console.log(event);
        eventDispatcher.sendEvent(event, "event", "Twitch");
        botEventRepository.storeGenericEvent(event);
        break;
  }
  res.status(200).send('OK');
});

app.get('/api/latest-messages', async (req, res) => {
  await botEventRepository.connect("messages");
  res.json((await botEventRepository.getLatestMessages()).reverse());
});

app.get('/api/all-badges', (req, res) => {
  res.json(cachedBadges);
});

app.get('/api/latest-events', async (req, res) => {
  await botEventRepository.connect("events");
  res.json(await botEventRepository.getLatestEvents());
});

const options = {
    cert: fs.readFileSync('./unterstadistycs.sytes.net-chain.pem'),
    key: fs.readFileSync('./unterstadistycs.sytes.net-key.pem')
}

https.createServer(options, app).listen(PORT, () => {
  console.log(`✅ Servidor Webhook escuchando en https://localhost:${PORT}`);
});

http.createServer(app).listen(80, () => {
  console.log('✅ Servidor HTTP escuchando en http://localhost:80');
});

function normalizeMessage(payload, platform){
  const doc = {
    payload,
    platform: platform,
    received_at: new Date().toISOString(),
  };
  return doc;
}

function normalizeEvent(event, eventType, platform){
  const doc = {
    event,
    event_type: eventType,
    platform: platform,
    received_at: new Date().toISOString(),
  };
  return doc;
}

async function fetchAndStoreBadges() {
  const twitchBot = new TwitchBot(config.Twitch);
  const appToken = await twitchBot.getAppAccessToken();
  const headers = {
    'Client-ID': config.Twitch.clientId,
    'Authorization': `Bearer ${appToken}`
  };

  const globalUrl = config.Twitch.globalBadgesUrl;
  const streamerUrl = `${config.Twitch.streamerBadgesUrl}?broadcaster_id=${config.Twitch.broadcasterId}`;

  const [globalResp, streamerResp] = await Promise.all([
    axios.get(globalUrl, { headers }),
    axios.get(streamerUrl, { headers })
  ]);

  const globalRaw = globalResp.data?.data || [];
  const streamerRaw = streamerResp.data?.data || [];

  const globalBadges = globalRaw.map(b => ({
    name: b.set_id,
    versions: b.versions
  }));

  const streamerBadges = streamerRaw.map(b => ({
    name: b.set_id,
    versions: b.versions
  }));

  const streamerNames = new Set(streamerBadges.map(b => b.name.trim().toLowerCase()));
  const filteredGlobalBadges = globalBadges.filter(b => !streamerNames.has(b.name.trim().toLowerCase()));

  await badgeRepo.connect();
  await badgeRepo.clearBadges();
  await badgeRepo.saveBadges([...filteredGlobalBadges, ...streamerBadges]);
  cachedBadges = [...filteredGlobalBadges, ...streamerBadges]

  console.log('✅ Badges de Twitch cargadas y almacenadas al inicio.');
}

// --- Bot Kick ---
async function main() {
  await botEventRepository.connect("messages");
  await botEventRepository.connect("events");
  const kickBot = new KickBot(config.Kick);

  const token = kickBot.loadToken();
  console.log(token);

  if (!token) {
    console.log('🔐 No hay token, autenticando...');
    await kickBot.getAuthenticationInformation();
  } else if (kickBot.isTokenExpired()) {
    console.log('⏳ Token expirado, renovando...');
    await kickBot.refreshTokenIfNeeded();
  }

  await kickBot.subscribeToEvents();

  const twitchBot = new TwitchBot(config.Twitch);
  const tokenTwitch = twitchBot.loadToken();
  console.log(tokenTwitch);

  if (!tokenTwitch) {
    console.log('🔐 No hay token Twitch, autenticando...');
    await twitchBot.getAuthenticationInformation();
  } else if (twitchBot.isTokenExpired()) {
    console.log('⏳ Token Twitch expirado, renovando...');
    await twitchBot.refreshTokenIfNeeded();
  }

  const appTokenData = twitchBot.loadAppToken();
  if (!appTokenData || twitchBot.isAppTokenExpired()) {
    console.log('🔐 No hay App Token Twitch o está expirado, obteniendo uno nuevo...');
    await twitchBot.getAppAccessToken();
  }

  await twitchBot.subscribeToEvents();
  await fetchAndStoreBadges();
}

main().catch(console.error);