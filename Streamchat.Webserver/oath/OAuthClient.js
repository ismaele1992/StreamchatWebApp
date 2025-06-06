const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const qs = require('qs');
const http = require('http');
const open = require('open');

class OAuthClient {
  constructor(config) {
    this.config = config;
    this.accessToken = '';
    this.refreshToken = '';
    this.tokenFile = config.tokenFile || 'oauthToken.json';
    this.expiresAt = null;
  }

  generateCodeVerifier() {
    this.codeVerifier = crypto.randomBytes(64).toString('hex');
    return this.codeVerifier;
  }

  generateCodeChallenge(codeVerifier) {
    const hash = crypto.createHash('sha256').update(codeVerifier).digest();
    return hash.toString('base64')
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  generateState() {
    this.state = crypto.randomBytes(16).toString('hex');
    return this.state;
  }

  saveToken(tokenData) {
    this.expiresAt = Date.now() + tokenData.expires_in * 1000;
    fs.writeFileSync(this.tokenFile, JSON.stringify({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      expires_at: this.expiresAt
    }, null, 2));
  }

  loadToken() {
    if (!fs.existsSync(this.tokenFile)) return null;
    const token = JSON.parse(fs.readFileSync(this.tokenFile));
    this.accessToken = token.access_token;
    this.refreshToken = token.refresh_token;
    this.expiresAt = token.expires_at;
    return token;
  }

  isTokenExpired() {
    return !this.expiresAt || Date.now() >= this.expiresAt;
  }

  async refreshTokenIfNeeded() {
    if (!this.refreshToken) throw new Error('No refresh token disponible');

    const response = await axios.post(this.config.tokenUrl, qs.stringify({
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    this.accessToken = response.data.access_token;
    this.refreshToken = response.data.refresh_token;
    this.saveToken(response.data);
  }

  async getAuthenticationInformation() {
    this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(this.codeVerifier);
    const state = this.generateState();

    console.log(this.config);

    const authUrl = `${this.config.authUrl}?` + qs.stringify({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state: state
    });

    console.log('\n==> URL completa de autorización:\n' + authUrl + '\n');
    const codePromise = this.listenForCodeAndState();
    await open(authUrl);                            // ⬅️ LUEGO abre navegador
    const { code, returnedState } = await codePromise;

    if (returnedState !== this.state) {
      throw new Error('El parámetro `state` no coincide. Posible ataque CSRF.');
    }

    const response = await axios.post(this.config.tokenUrl, qs.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code_verifier: this.codeVerifier
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    this.accessToken = response.data.access_token;
    this.refreshToken = response.data.refresh_token;
    this.saveToken(response.data);

    console.log('✅ Token obtenido y guardado con éxito.');
  }

  listenForCodeAndState(port = 8090) {
    return new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const code = url.searchParams.get('code');
        const returnedState = url.searchParams.get('state');

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>✅ Autenticación completada. Puedes cerrar esta ventana.</h1>');

        server.close();

        if (!code) {
          return reject(new Error('No se recibió ningún código de autorización.'));
        }

        resolve({ code, returnedState });
      });

      server.listen(port, () => {
        console.log(`➡️  Esperando redirección en http://localhost:${port}/`);
      });

      server.on('error', (err) => reject(err));
    });
  }
}

module.exports = OAuthClient;