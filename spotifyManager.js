// spotifyManager.js
let spotifyManager = null;

let signInButton = null;
let selectPlaylistButton = null;
let insertLinkButton = null;

// Function to reset the authentication state
function resetAuthState() {
    window.history.replaceState({}, document.title, window.location.pathname);
    localStorage.removeItem('code_verifier');
    localStorage.removeItem('access_token');
    spotifyManager = null; // Reset the spotifyManager instance
    
    // Reset UI elements
    if (signInButton) signInButton.hidden = false;
    if (selectPlaylistButton) selectPlaylistButton.hidden = true;
    if (insertLinkButton) insertLinkButton.hidden = true;

    setupEventListeners();
}

function setupEventListeners() {
    signInButton = document.getElementById('signIn');
    selectPlaylistButton = document.getElementById('selectPlaylist');
    insertLinkButton = document.getElementById('insertLink');

    if (signInButton) {
        // Remove any existing listeners first
        signInButton.replaceWith(signInButton.cloneNode(true));
        signInButton = document.getElementById('signIn');
        
        signInButton.addEventListener('click', async (event) => {
            event.preventDefault();
            console.log('Sign in button clicked');
            try {
                console.log('Starting auth process');
                resetAuthState();

                if (!spotifyManager) {
                    console.log('Creating new SpotifyManager');
                    spotifyManager = new SpotifyManager();
                    console.log('Calling initialize()');
                    await spotifyManager.initialize();
                }
            } catch (error) {
                console.log('Caught error in click handler:', error);
                console.error('Sign in error:', error);
                resetAuthState();
            }
        });
    }

    if (selectPlaylistButton) {
        // Remove any existing listeners first
        selectPlaylistButton.replaceWith(selectPlaylistButton.cloneNode(true));
        selectPlaylistButton = document.getElementById('selectPlaylist');

        selectPlaylistButton.addEventListener('click', async () => {
            console.log("select playlist button clicked")
            if (spotifyManager) {
                try {
                    playlists = await spotifyManager.getUserPlaylists();

                    // Create a dropdown with the playlists
                    const playlistSelect = document.createElement('select');
                    playlistSelect.id = 'playlist-select';
                    
                    playlists.forEach(playlist => {
                        const option = document.createElement('option');
                        option.value = playlist.id;
                        option.textContent = `${playlist.name} (${playlist.tracks.total} tracks)`;
                        playlistSelect.appendChild(option);
                    });

                    // Add the dropdown to the page
                    const container = document.getElementById('playlist-container'); // Make sure you have this element in your HTML
                    if (container) {
                        container.innerHTML = ''; // Clear any existing content
                        container.appendChild(playlistSelect);
                    }
                    // TODO: add default option
                    // TODO: handle a selection ("change") being made

                    // Hide other content
                    signInButton.hidden = true;
                    selectPlaylistButton.hidden = true;
                    insertLinkButton.hidden = true;
                } catch (error) {
                    console.error('Error handling playlists:', error);
                    if (error.message.includes('No access token found')) {
                        resetAuthState();
                    }
                }
            }
        });
    }
}

class SpotifyManager {
    constructor() {
        this.clientId = 'ce3914433ab04d3189ece1b95ca11ec5';
        this.redirectUri = 'http://127.0.0.1:5500/index.html';
        this.scope = 'user-read-private user-read-email playlist-read-private';
        this.codeVerifier = this.#generateRandomString(64);
        this.authUrl = new URL("https://accounts.spotify.com/authorize");
        this.tokenUrl = "https://accounts.spotify.com/api/token";
        this.accessToken = localStorage.getItem('access_token');
    }

    async initialize() {
        try {
            // Get URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const error = urlParams.get('error');

            // If there's an error, clear it and throw
            if (error) {
                window.history.replaceState({}, document.title, window.location.pathname);
                throw new Error(`Authorization error: ${error}`);
            }
            
            if (code) {
                window.history.replaceState({}, document.title, "/");
                return await this.#getToken(code);
            } else {
                // Start the authorization flow
                this.hashed = await this.#sha256(this.codeVerifier);
                this.codeChallenge = this.#base64encode(this.hashed);
                
                const params = {
                    response_type: 'code',
                    client_id: this.clientId,
                    scope: this.scope,
                    code_challenge_method: 'S256',
                    code_challenge: this.codeChallenge,
                    redirect_uri: this.redirectUri,
                    state: this.#generateRandomString(16), // Add state parameter for security
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

    #generateRandomString (length) {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const values = crypto.getRandomValues(new Uint8Array(length));
        return values.reduce((acc, x) => acc + possible[x % possible.length], "");
    }
    
    async #sha256 (plain) {
        const encoder = new TextEncoder()
        const data = encoder.encode(plain)
        return window.crypto.subtle.digest('SHA-256', data)
    }
    
    #base64encode (input) {
        return btoa(String.fromCharCode(...new Uint8Array(input)))
          .replace(/=/g, '')
          .replace(/\+/g, '-')
          .replace(/\//g, '_');
    }

    async #getToken(code) {
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
                this.accessToken = data.access_token;
                localStorage.setItem('access_token', data.access_token);
                localStorage.removeItem('code_verifier');

                // Test the token immediately
                try {
                    const testResponse = await fetch('https://api.spotify.com/v1/me', {
                        headers: {
                            'Authorization': `Bearer ${data.access_token}`
                        }
                    });
                    if (testResponse.ok) {
                        const userData = await testResponse.json();
                        console.log('Successfully authenticated with Spotify. User data:', userData);
                    }
                } catch (error) {
                    console.error('Token validation failed:', error);
                }

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

    async getUserPlaylists() {
        try {
            if (!this.accessToken) {
                throw new Error('No access token found');
            }
    
            let url = 'https://api.spotify.com/v1/me/playlists?limit=20'; // Get 20 playlists at a time
            // TODO: use 'offset' in combination with 'limit' to create pages for super playlisters
            //      -> can use a while(url) loop to keep fetching, handling pagination
    
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            console.log('Fetched playlists:', data.items.map(playlist => ({
                name: playlist.name,
                id: playlist.id,
                trackCount: playlist.tracks.total,
                coverArt: playlist.images[0]?.url // Assuming the first image is the cover art
            })));
            
            return data.items;
        } catch (error) {
            console.error('Error fetching playlists:', error);
            throw error;
        }
    }    
}

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();

    // Check if we have an authorization code
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
        console.error('Authorization error:', error);
        resetAuthState();
        return;
    }

    if (code) {
        spotifyManager = new SpotifyManager();
        spotifyManager.initialize().then(async () => {
            console.log('Authorization completed successfully');
            signInButton.hidden = true;
            selectPlaylistButton.hidden = false;
            insertLinkButton.hidden = false;
        }).catch(error => {
            console.error('Authorization failed:', error);
            resetAuthState();
        });
    } else {
        // Check if we're already authorized (returning/refreshing user)
        const accessToken = localStorage.getItem('access_token');
        if (accessToken) {
            signInButton.hidden = true;
            selectPlaylistButton.hidden = false;
            insertLinkButton.hidden = false;
            spotifyManager = new SpotifyManager();
        }
    }
});