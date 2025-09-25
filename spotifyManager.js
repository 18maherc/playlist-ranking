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

async function startGameFromPlaylist(selectedPlaylistId) {
    const playlistItems = await spotifyManager.getPlaylistItems(selectedPlaylistId);

    // Always create a new playlist manager for new selections
    currentPlaylistManager = new PlaylistManager();
    currentPlaylistManager.configurePlaylist(playlistItems);
    
    // Reset game manager state for new playlist
    if (gameManager) {
        gameManager.currentMatchupQueue = [];
        gameManager.currentMainSong = null;
    }
    
    startMatchups();
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
            try {
                resetAuthState();

                if (!spotifyManager) {
                    spotifyManager = new SpotifyManager();
                    await spotifyManager.initialize();
                }
            } catch (error) {
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
            if (spotifyManager) {
                try {
                    // Create a 5x5 grid of playlist covers.
                    // TODO: have this created somewhere else and show/hide it instead of making it on-the-fly
                    const playlistGrid = document.createElement('div');
                    playlistGrid.id = 'playlist-grid';

                    playlists = await spotifyManager.getUserPlaylists();
                    playlists.slice(0, 25).forEach(playlist => {
                        const playlistItem = document.createElement('div');
                        playlistItem.id = 'playlist-item';
                        playlistItem.dataset.playlistId = playlist.id;
                        
                        const img = document.createElement('img');
                        img.src = playlist.images?.[0]?.url || 'svg/default-playlist.svg';
                        img.alt = playlist.name;
                        
                        const tooltip = document.createElement('div');
                        tooltip.id = 'playlist-tooltip';
                        tooltip.textContent = `${playlist.name} (${playlist.tracks.total} tracks)`;
                        
                        playlistItem.appendChild(img);
                        playlistItem.appendChild(tooltip);
                        playlistGrid.appendChild(playlistItem);
                    });

                    // Add the modal to the page
                    openModal("Select a playlist", playlistGrid.outerHTML);
                    
                    // Add click event listener after modal is opened
                    setTimeout(() => {
                        const modalPlaylistGrid = document.getElementById('playlist-grid');
                        if (modalPlaylistGrid) {
                            modalPlaylistGrid.addEventListener('click', async (event) => {
                                const playlistItem = event.target.closest('#playlist-item');
                                if (!playlistItem) return;
                                
                                const selectedPlaylistId = playlistItem.dataset.playlistId;
                                const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);
                                
                                if (selectedPlaylist) {
                                    console.log('Selected playlist:', selectedPlaylist);
                                    try {
                                        startGameFromPlaylist(selectedPlaylistId);
                                        closeModal();
                                    } catch (error) {
                                        console.error('Error configuring playlist:', error);
                                    }
                                }
                            });
                        }
                    }, 100);

                    // Hide other content
                    signInButton.hidden = true;
                    // selectPlaylistButton.hidden = true;
                    // insertLinkButton.hidden = true;
                } catch (error) {
                    console.error('Error handling playlists:', error);
                    if (error.message.includes('No access token found')) {
                        resetAuthState();
                    }
                }
            }
        });
    }

    if (insertLinkButton) {
        // Remove any existing listeners first
        insertLinkButton.replaceWith(insertLinkButton.cloneNode(true));
        insertLinkButton = document.getElementById('insertLink');

        insertLinkButton.addEventListener('click', () => {
            if (spotifyManager) {
                const linkEntry = document.createElement('div');
                linkEntry.id = 'link-entry';
                
                const linkTextBox = document.createElement('input');
                linkTextBox.type = 'url';
                linkTextBox.placeholder = 'https://open.spotify.com/playlist/...';
                linkTextBox.style.width = '100%';
                linkTextBox.style.marginBottom = '1rem';
                
                const submitBtn = document.createElement('button');
                submitBtn.id = 'submit-btn';
                submitBtn.textContent = 'Load Playlist';
                
                // Add elements to container
                linkEntry.appendChild(linkTextBox);
                linkEntry.appendChild(submitBtn);
                
                openModal("Insert a playlist link", linkEntry.outerHTML);

                setTimeout(() => {
                    const modalSubmitBtn = document.getElementById('submit-btn');
                    const modalLinkInput = document.querySelector('#link-entry input');
                    if (modalSubmitBtn) {
                        modalSubmitBtn.addEventListener('click', async() => {
                            const playlistUrl = modalLinkInput.value; // Get from DOM element
                            if(playlistUrl) {
                                const playlistId = spotifyManager.extractPlaylistId(playlistUrl);
                                if (playlistId) {
                                    console.log("User-inserted playlist identified as: ", playlistId);
                                    startGameFromPlaylist(playlistId);
                                    closeModal();
                                } else {
                                    showError('❌ Please enter a valid Spotify playlist URL');
                                    linkTextBox.addEventListener('input', hideError);
                                }
                            }
                        })
                    }
                }, 100);
            }
        })
    }
}

class SpotifyManager {
    constructor() {
        this.clientId = 'ce3914433ab04d3189ece1b95ca11ec5';
        this.redirectUri = window.location.hostname === '127.0.0.1' || 
                           window.location.hostname === 'localhost' 
                           ? 'http://127.0.0.1:5500/index.html' 
                           : 'https://18maherc.github.io/playlist-ranking/';
        this.scope = 'user-read-private user-read-email playlist-read-private playlist-modify-private'; // TODO: figure out a cleaner way to list all the scopes
        this.codeVerifier = this.#generateRandomString(64);
        this.authUrl = new URL("https://accounts.spotify.com/authorize");
        this.tokenUrl = "https://accounts.spotify.com/api/token";
        this.accessToken = localStorage.getItem('access_token');
        this.refreshToken = localStorage.getItem('refresh_token');
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
                if (data.refresh_token) {
                    this.refreshToken = data.refresh_token;
                    localStorage.setItem('refresh_token', data.refresh_token);
                }
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

    async #refreshAccessToken() {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }
    
        const response = await fetch(this.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: this.refreshToken,
                client_id: this.clientId,
            }),
        });
    
        const data = await response.json();
        if (response.ok) {
            this.accessToken = data.access_token;
            localStorage.setItem('access_token', data.access_token);
            return data.access_token;
        } else {
            // If refresh fails, reset auth state
            resetAuthState();
            throw new Error('Failed to refresh token');
        }
    }

    async #checkToken(){
        if (!this.accessToken) {
            throw new Error('No access token found');
        } else {
            // Test the token with a lightweight API call
            try {
                const response = await fetch('https://api.spotify.com/v1/me', {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                });

                if (response.status === 401) {
                    console.log('Token expired, refreshing...');
                    await this.#refreshAccessToken();
                } else if (!response.ok) {
                    throw new Error(`Token validation failed with status: ${response.status}`);
                }
            } catch (error) {
                if (error.message.includes('Failed to refresh token')) {
                    resetAuthState();
                }
                throw error;
            }
        }
    }

    async getUserPlaylists() {
        try {
            await this.#checkToken();
    
            let url = 'https://api.spotify.com/v1/me/playlists?limit=25'; // Get 25 playlists at a time
            // TODO: use 'offset' in combination with 'limit' to create pages for super playlisters
            //      -> can use a while(url) loop to keep fetching, handling pagination
            // TODO: can probably just drop this link into the response line below
    
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Separate valid and invalid playlists
            const faultyPlaylists = [];
            const validPlaylists = data.items.filter(playlist => {
                if (!playlist || !playlist.name || !playlist.id) {
                    faultyPlaylists.push(playlist);
                    return false;
                }
                return true;
            });

            // Log information about faulty playlists
            if (faultyPlaylists.length > 0) {
                console.warn(`Found ${faultyPlaylists.length} invalid playlist(s):`, faultyPlaylists);
            }

            console.log('Fetched playlists:', validPlaylists.map(playlist => ({
                    name: playlist.name || 'Unnamed Playlist',
                    id: playlist.id,
                    trackCount: playlist.tracks?.total || 0,
                    coverArt: playlist.images?.[0]?.url // Assuming the first image is the cover art
                }))
            );
            
            return validPlaylists;
        } catch (error) {
            console.error('Error fetching playlists:', error);
            throw error;
        }
    }

    async getPlaylistItems(playlistID) {
        try {
            await this.#checkToken();
    
            let allItems = [];
            let url = `https://api.spotify.com/v1/playlists/${playlistID}/tracks?limit=50`;

            // Keep fetching while we have a next URL
            // TODO: have a loading indicator, progress bar, or total count status
            while (url) {
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                
                // Add this batch of items to our array
                allItems = [...allItems, ...data.items];
                
                // Update URL for next batch, will be null when no more items
                url = data.next;
            }

            // Log a simplified version for debugging but return full items
            console.log('Fetched all playlist items:', allItems.map(item => ({
                name: item.track.name,
                artist: item.track.artists[0].name,
                id: item.track.id
            })));
            
            return allItems;
        } catch (error) {
            console.error('Error fetching playlist items:', error);
            throw error;
        }
    }

    extractPlaylistId(url) {
        // TODO: expand this to also handle other input types, such as raw ID or URI (low priority)
        const spotifyPlaylistRegex = /^https:\/\/open\.spotify\.com\/playlist\/([a-zA-Z0-9]{22})(\?.*)?$/;

        const match = url.match(spotifyPlaylistRegex);
        return match ? match[1] : null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();

    // Check if we have an authorization code
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
        console.error('Authorization error:', error);
        resetAuthState();
        return;
    }

    if (authCode) {
        spotifyManager = new SpotifyManager();
        spotifyManager.initialize().then(async () => {
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
        const refreshToken = localStorage.getItem('refresh_token');

        if (accessToken && refreshToken) {
            signInButton.hidden = true;
            selectPlaylistButton.hidden = false;
            insertLinkButton.hidden = false;
            spotifyManager = new SpotifyManager();
        } else {
            resetAuthState();
        }
    }
});