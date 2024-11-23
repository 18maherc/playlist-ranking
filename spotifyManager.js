// spotifyManager.js
let spotifyManager = null;

class SpotifyManager {
    constructor() {
        this.codeVerifier = generateRandomString(64);
    }

    async initialize() {
        this.hashed = await sha256(codeVerifier);
        this.codeChallenge = base64encode(hashed);
        const clientId = 'ce3914433ab04d3189ece1b95ca11ec5';
        const redirectUri = 'http://localhost:8080';
        const scope = 'user-read-private user-read-email';
        const authUrl = new URL("https://accounts.spotify.com/authorize");
        const params =  {
            response_type: 'code',
            client_id: clientId,
            scope,
            code_challenge_method: 'S256',
            code_challenge: codeChallenge,
            redirect_uri: redirectUri,
        };

        window.localStorage.setItem('code_verifier', codeVerifier);
        authUrl.search = new URLSearchParams(params).toString();
        window.location.href = authUrl.toString();
    }

    generateRandomString (length) {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const values = crypto.getRandomValues(new Uint8Array(length));
        return values.reduce((acc, x) => acc + possible[x % possible.length], "");
    }
    
    async sha256 (plain) {
        const encoder = new TextEncoder()
        const data = encoder.encode(plain)
        return window.crypto.subtle.digest('SHA-256', data)
    }
    
    base64encode (input) {
        return btoa(String.fromCharCode(...new Uint8Array(input)))
          .replace(/=/g, '')
          .replace(/\+/g, '-')
          .replace(/\//g, '_');
    }    
}

document.addEventListener('DOMContentLoaded', () => {
    const signInButton = document.getElementById('signInButton');

    if (signInButton) {
        signInButton.addEventListener('click', async () => {
            if (!spotifyManager) {
                spotifyManager = new SpotifyManager();
                await spotifyManager.initialize();
            }
        });
    } else {
        console.error('Sign-in button not found');
    }
});