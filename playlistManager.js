// playlistManager.js
let currentPlaylistManager = null;

// File selection function
function openFileSelector() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    // Create an instance of PlaylistManager and upload the data
                    currentPlaylistManager = new PlaylistManager();
                    currentPlaylistManager.uploadPlaylist(jsonData);
                    startMatchups();
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                }
            };
            reader.readAsText(file);
        }
    };
    
    fileInput.click();
}

function startMatchups() {
    console.log('Starting matchups, currentPlaylistManager:', currentPlaylistManager); // Check if manager exists
    if (currentPlaylistManager) {
        // Get matchup elements
        const matchup = currentPlaylistManager.getMatchup();
        
        // Update UI with the matchup
        displayMatchup(matchup);
    }
}

function displayMatchup(matchup) {
    if (!matchup || matchup.length !== 2) {
        console.error('Invalid matchup');
        return;
    }

    // Remove existing players at the start of displayMatchup()
    const existingPlayers = document.querySelectorAll('.song-player');
    existingPlayers.forEach(player => player.remove());

    const [song1, song2] = matchup;
    console.log('Displaying songs:', song1, song2); // Check songs being displayed
    
    // Update the card contents
    try {
        // First card
        const card1 = document.querySelector('.card1');
        const card1Song = document.querySelector('.card1 > .song');
        const song1Title = document.querySelector('.song.song1 .title');
        const song1Artist = document.querySelector('.song.song1 .artist');
        const song1Album = document.querySelector('.song.song1 .album');
        const song1Elo = document.querySelector('.card1 p b');

        if (song1Title) song1Title.textContent = song1.title || 'Unknown Title';
        if (song1Artist) song1Artist.textContent = song1.artist || 'Unknown Artist';
        if (song1Album) song1Album.textContent = song1.album || 'Unknown Album';
        if (song1Elo) song1Elo.textContent = song1.elo || 'Unknown ELO';
        // Add card1 art
        if (card1 && song1.art) {
            card1Song.style.setProperty('--bg-image', `url(${song1.art})`);
        }
        // Add a way to play the song
        // TODO: handle case of Premium auth vs Client auth
        //      - as of Nov 27, 2024, preview_url is deprecated
        //          (https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api)
        //      - this article mentions workarounds and potential new support in future: 
        //          https://community.spotify.com/t5/Spotify-for-Developers/Missing-Preview-URL-using-Client-Credentials/m-p/6492694#M15470
        //      - Alternatively, could design a custom player and use Web Playback SDK

        // Create new iframe element
        //      - need to do this dynamically to avoid a MutationObserver error on the iframe
        const song1Player = document.createElement('iframe');
        // Set all attributes before adding to DOM
        song1Player.className = 'song-player';
        song1Player.src = `https://open.spotify.com/embed/track/${song1.id}?utm_source=generator&theme=0&hide_cover=1&view=minimal`;
        song1Player.width = '100%';
        song1Player.height = '80'; // Smaller fixed height
        song1Player.style = 'border-radius:12px; max-height:80px;';
        song1Player.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
        song1Player.loading = 'lazy';
        // Add the new iframe to the DOM
        if (card1) {
            card1.appendChild(song1Player);
        }

        // Second card
        const card2 = document.querySelector('.card2');
        const card2Song = document.querySelector('.card2 > .song');
        const song2Title = document.querySelector('.song.song2 .title');
        const song2Artist = document.querySelector('.song.song2 .artist');
        const song2Album = document.querySelector('.song.song2 .album');
        const song2Elo = document.querySelector('.card2 p b');

        if (song2Title) song2Title.textContent = song2.title || 'Unknown Title';
        if (song2Artist) song2Artist.textContent = song2.artist || 'Unknown Artist';
        if (song2Album) song2Album.textContent = song2.album || 'Unknown Album';
        if (song2Elo) song2Elo.textContent = song2.elo || 'Unknown ELO';
        if (card2 && song2.art) {
            card2Song.style.setProperty('--bg-image', `url(${song2.art})`);
        }
        // Create new iframe element
        const song2Player = document.createElement('iframe');
        // Set all attributes before adding to DOM
        song2Player.className = 'song-player';
        song2Player.src = `https://open.spotify.com/embed/track/${song2.id}?utm_source=generator&theme=0&hide_cover=1&view=minimal`;
        song2Player.width = '100%';
        song2Player.height = '80'; // Smaller fixed height
        song2Player.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
        song2Player.loading = 'lazy';
        // Add the new iframe to the DOM
        if (card2) {
            card2.appendChild(song2Player);
        }

        // Update the game manager with the current matchup
        if(gameManager){
            gameManager.setCurrentMatchup(matchup);
        } else {
            console.error('Game manager not initialized');
        }

    } catch (error) {
        console.error('Error updating display:', error);
    }
}

class PlaylistManager {
    constructor() {
        this.records = {};
        this.completedMatchups = {};
    }

    uploadPlaylist(jsonData){
        // TODO: add schema validation??
        if(jsonData.Records){
            this.records = jsonData.Records;
        }
        if(jsonData.CompletedMatchups){
            this.completedMatchups = jsonData.CompletedMatchups;
        }
        console.log('Playlist uploaded:', this.records);
    }

    getMatchup() {
        const songTitles = Object.keys(this.records);
        
        if (songTitles.length < 2) {
            throw new Error('Not enough songs for a matchup');
        }

        // TODO: implement a better algorithm than random
        //      - slightly favor selecting higher ranked songs to get more exposure
        //      - slightly favor closer matchups
    
        // Get first random song
        const song1Title = songTitles[Math.random() * songTitles.length | 0];
        
        // Get second random song by picking from remaining songs
        const remainingSongs = songTitles.filter(song => song !== song1Title);
        const song2Title = remainingSongs[Math.random() * remainingSongs.length | 0];

        const song1 = this.records[song1Title];
        const song2 = this.records[song2Title];
    
        console.log('Matchup:', [song1, song2]);
        
        return [song1, song2];
    }

    checkMatchupCompleted(matchup) {
        return this.#sortedMatchup(matchup) in this.completedMatchups;
    }

    completeMatchup(matchup, result) {
        const { winner, loser, newElos } = result;

        // Update the records with new ELO ratings
        this.records[winner.title].elo = Math.round(newElos.winner);
        this.records[loser.title].elo = Math.round(newElos.loser);

        // TODO: sort ELO records high to low

        // Store the completed matchup result
        const matchupKey = this.#sortedMatchup(matchup);
        this.completedMatchups[matchupKey] = winner.title;

        // TODO: autosave to cookies

        console.log(`Updated ELO ratings:
            ${winner.title}: ${newElos.winner}
            ${loser.title}: ${newElos.loser}`);
    }

    #sortedMatchup(matchup) {
        if (!matchup || matchup.length !== 2) {
            console.error('Invalid matchup for sorting:', matchup);
            return null;
        }
    
        // Sort the titles alphabetically to ensure consistent ordering
        const titles = [matchup[0].title, matchup[1].title].sort();
        
        // Create a consistent matchup string format
        return `${titles[0]} vs ${titles[1]}`;
    }

    exportJSON() {
        // TODO: sort the JSON based on ELO??

        // Create the export object containing records and completed matchups
        const exportData = {
            Records: this.records,
            CompletedMatchups: this.completedMatchups
        };
    
        // Convert the data to a JSON string
        const jsonString = JSON.stringify(exportData, null, 2);
    
        // Create a Blob containing the JSON data
        const blob = new Blob([jsonString], { type: 'application/json' });
    
        // Create a URL for the Blob
        const url = URL.createObjectURL(blob);
    
        // Create a temporary anchor element
        const link = document.createElement('a');
        link.href = url;
        link.download = 'playlist-rankings.json'; // Default filename
    
        // Append to document, click programmatically, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    
        // Clean up by revoking the URL
        URL.revokeObjectURL(url);
    }

    configurePlaylist(playlistItems) {
        // Initialize or reset the records and completedMatchups
        this.records = {};
        this.completedMatchups = {};
    
        // Process each track from the playlist
        playlistItems.forEach(item => {
            const trackInfo = {
                title: item.track.name,
                artist: item.track.artists[0].name,
                album: item.track.album.name,
                art: item.track.album.images[0]?.url || null,
                id: item.track.id,
                elo: item.elo || 1200,
            };

            this.records[trackInfo.title] = trackInfo;
        });
        console.log('Playlist configured:', this.records);
    }
    
}

document.addEventListener('DOMContentLoaded', () => {
    // Add upload button handler with existence check
    const uploadButton = document.getElementById('uploadJSON');
    if (uploadButton) {
        uploadButton.addEventListener('click', openFileSelector);
    } else {
        console.error('Upload button not found');
    }

    // Add export button handler
    const exportButton = document.getElementById('exportJSON');
    if (exportButton) {
        exportButton.addEventListener('click', () => {
            if (currentPlaylistManager) {
                currentPlaylistManager.exportJSON();
            } else {
                console.error('No playlist data to export');
            }
        });
    } else {
        console.error('Export button not found');
    }
});
