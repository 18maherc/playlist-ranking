// spotifyManager.js
let spotifyManager = null;

class SpotifyManager {
    constructor() {
        this.clientId = 'ce3914433ab04d3189ece1b95ca11ec5';
        this.redirectUri = 'http://127.0.0.1:5500/index.html';
        this.scope = 'user-read-private user-read-email';
        this.codeVerifier = this.generateRandomString(64);
        this.authUrl = new URL("https://accounts.spotify.com/authorize");
        this.tokenUrl = "https://accounts.spotify.com/api/token";
    }

    async initialize() {
        try {
            // Get URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            
            if (code) {
                window.history.replaceState({}, document.title, "/");
                return await this.getToken(code);
            } else {
                // Start the authorization flow
                this.hashed = await this.sha256(this.codeVerifier);
                this.codeChallenge = this.base64encode(this.hashed);
                
                const params = {
                    response_type: 'code',
                    client_id: this.clientId,
                    scope: this.scope,
                    code_challenge_method: 'S256',
                    code_challenge: this.codeChallenge,
                    redirect_uri: this.redirectUri,
                    state: this.generateRandomString(16), // Add state parameter for security
                };

                window.localStorage.setItem('code_verifier', this.codeVerifier);
                this.authUrl.search = new URLSearchParams(params).toString();
                console.log('Redirecting to:', this.authUrl.toString());
                window.location.href = this.authUrl.toString();
            }
        } catch (error) {
            console.error('Initialization error:', error);
            throw error;
        }
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

    async getToken(code) {
        try {
            const codeVerifier = localStorage.getItem('code_verifier');
            
            if (!codeVerifier) {
                throw new Error('No code verifier found in storage');
            }

            const response = await fetch(this.tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: this.clientId,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: this.redirectUri,
                    code_verifier: codeVerifier,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('access_token', data.access_token);
                localStorage.removeItem('code_verifier');
                return data;
            } else {
                console.error('Token request failed:', data);
                throw new Error(data.error_description || 'Failed to get token');
            }
        } catch (error) {
            console.error('Error in getToken:', error);
            throw error;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const signInButton = document.getElementById('signIn');

    // Check if we have an authorization code
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
        console.error('Authorization error:', error);
        return;
    }

    if (code) {
        spotifyManager = new SpotifyManager();
        spotifyManager.initialize().then(() => {
            console.log('Authorization completed successfully');
        }).catch(error => {
            console.error('Authorization failed:', error);
        });
    }

    if (signInButton) {
        signInButton.addEventListener('click', async (event) => {
            event.preventDefault();
            try {
                if (!spotifyManager) {
                    spotifyManager = new SpotifyManager();
                    await spotifyManager.initialize();
                }
            } catch (error) {
                console.error('Sign in error:', error);
            }
        });
    } else {
        console.error('Sign-in button not found');
    }
});