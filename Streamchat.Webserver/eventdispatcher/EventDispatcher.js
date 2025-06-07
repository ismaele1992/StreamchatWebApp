const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');

class EventDispatcher {
  constructor(securePort = 8443, insecurePort = 8081) {
    this.clients = new Set();
    this.pendingAcks = new Map(); // <- Guarda intervalos por eventId

    // WSS server (puerto 8443)
    const wssOptions = {
      cert: fs.readFileSync('./unterstadistycs.sytes.net-chain.pem'),
      key: fs.readFileSync('./unterstadistycs.sytes.net-key.pem')
    };

    const httpsWssServer = https.createServer(wssOptions);
    this.wssSecure = new WebSocket.Server({ server: httpsWssServer });

    httpsWssServer.listen(securePort, () => {
      console.log(`✅ WSS server escuchando en puerto ${securePort}`);
    });

    this.wssSecure.on('connection', (ws) => {
      this.handleConnection(ws);
    });

    // WS server (puerto 8081)
    this.wssInsecure = new WebSocket.Server({ port: insecurePort });

    this.wssInsecure.on('listening', () => {
      console.log(`✅ WS server escuchando en puerto ${insecurePort}`);
    });

    this.wssInsecure.on('connection', (ws) => {
      this.handleConnection(ws);
    });
  }

  handleConnection(ws) {
    this.clients.add(ws);

    ws.on('close', () => {
      this.clients.delete(ws);
    });

    ws.on('message', (msg) => {
      try {
        const parsed = JSON.parse(msg);
        if (parsed.type === 'ack') {
          const interval = this.pendingAcks.get(parsed.eventId);
          if (interval) {
            clearInterval(interval);
            this.pendingAcks.delete(parsed.eventId);
          }
        }
      } catch (err) {
        console.error('❌ Error al parsear mensaje recibido del cliente:', err.message);
      }
    });
  }

  sendEvent(eventData, type, platform, retries = 3) {
    const message = {
      ...eventData,
      platform: platform,
      type: type,
      eventId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
    const payload = JSON.stringify(message);

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        let attempts = 0;
        const interval = setInterval(() => {
          if (attempts >= retries) {
            console.error(`❌ Evento ${message.eventId} no confirmado tras ${retries} intentos`);
            clearInterval(interval);
            this.pendingAcks.delete(message.eventId);
            return;
          }
          client.send(payload);
          attempts++;
        }, 2000);

        // Guardamos el intervalo para cancelarlo al recibir el ack
        this.pendingAcks.set(message.eventId, interval);
      }
    });
  }
}

module.exports = EventDispatcher;