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

    const [song1, song2] = matchup;
    console.log('Displaying songs:', song1, song2); // Check songs being displayed

    
    // Update the card contents
    try {
        // First card
        const card1 = document.querySelector('.card1');
        const song1Title = document.querySelector('.song.song1 .title');
        const song1Artist = document.querySelector('.song.song1 .artist');
        const song1Album = document.querySelector('.song.song1 .album');
        const song1Elo = document.querySelector('.card1 p b');

        if (song1Title) song1Title.textContent = song1.title || 'Unknown Title';
        if (song1Artist) song1Artist.textContent = song1.artist || 'Unknown Artist';
        if (song1Album) song1Album.textContent = song1.album || 'Unknown Album';
        if (song1Elo) song1Elo.textContent = song1.elo || 'Unknown ELO';
        if (card1 && song1.art) {
            card1.style.backgroundImage = `url(${song1.art})`;
            card1.style.backgroundSize = 'cover';
            card1.style.backgroundPosition = 'center';
        }

        // Second card
        const card2 = document.querySelector('.card2');
        const song2Title = document.querySelector('.song.song2 .title');
        const song2Artist = document.querySelector('.song.song2 .artist');
        const song2Album = document.querySelector('.song.song2 .album');
        const song2Elo = document.querySelector('.card2 p b');

        if (song2Title) song2Title.textContent = song2.title || 'Unknown Title';
        if (song2Artist) song2Artist.textContent = song2.artist || 'Unknown Artist';
        if (song2Album) song2Album.textContent = song2.album || 'Unknown Album';
        if (song2Elo) song2Elo.textContent = song2.elo || 'Unknown ELO';
        if (card2 && song2.art) {
            card2.style.backgroundImage = `url(${song2.art})`;
            card2.style.backgroundSize = 'cover';
            card2.style.backgroundPosition = 'center';
        }
        // TODO: fix the background image styling stuff

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
    
        // Get first random song
        const song1Title = songTitles[Math.random() * songTitles.length | 0];
        
        // Get second random song by picking from remaining songs
        const remainingSongs = songTitles.filter(song => song !== song1Title);
        const song2Title = remainingSongs[Math.random() * remainingSongs.length | 0];

        const song1 = {
            ...this.trackInfo[song1Title],
            elo: this.records[song1Title]
        };
        
        const song2 = {
            ...this.trackInfo[song2Title],
            elo: this.records[song2Title]
        };
    
        console.log('Matchup:', [song1, song2]);
        
        return [song1, song2];
    }

    checkMatchupCompleted(matchup) {
        return this.#sortedMatchup(matchup) in this.completedMatchups;
    }

    completeMatchup(matchup, result) {
        const { winner, loser, newElos } = result;

        // Update the records with new ELO ratings
        this.records[winner.title] = Math.round(newElos.winner);
        this.records[loser.title] = Math.round(newElos.loser);

        // Store the completed matchup result
        const matchupKey = this.#sortedMatchup(matchup);
        this.completedMatchups[matchupKey] = winner.title;

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
        this.trackInfo = {};
    
        // Process each track from the playlist
        playlistItems.forEach(item => {
            const trackInfo = {
                title: item.track.name,
                artist: item.track.artists[0].name,
                album: item.track.album.name,
                art: item.track.album.images[0]?.url || null,
                id: item.track.id
            };

            this.trackInfo[trackInfo.title] = trackInfo;
            this.records[trackInfo.title] = 1200;
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
