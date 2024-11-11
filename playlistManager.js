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
        const song1Title = document.querySelector('.song.song1 .title');
        const song1Artist = document.querySelector('.song.song1 .artist');
        const song1Album = document.querySelector('.song.song1 .album');
        const song1Elo = document.querySelector('.card1 p b');

        if (song1Title) song1Title.textContent = song1.title || 'Unknown Title';
        if (song1Artist) song1Artist.textContent = song1.artist || 'Unknown Artist';
        if (song1Album) song1Album.textContent = song1.album || 'Unknown Album';
        if (song1Elo) song1Elo.textContent = song1.elo || 'Unknown ELO';

        // Second card
        const song2Title = document.querySelector('.song.song2 .title');
        const song2Artist = document.querySelector('.song.song2 .artist');
        const song2Album = document.querySelector('.song.song2 .album');
        const song2Elo = document.querySelector('.card2 p b');

        if (song2Title) song2Title.textContent = song2.title || 'Unknown Title';
        if (song2Artist) song2Artist.textContent = song2.artist || 'Unknown Artist';
        if (song2Album) song2Album.textContent = song2.album || 'Unknown Album';
        if (song2Elo) song2Elo.textContent = song2.elo || 'Unknown ELO';

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
        this.records = jsonData.Records;
        // this.completedMatchups = jsonData.CompletedMatchups;
        console.log('Playlist uploaded:', this.records);
    }

    getMatchup() {
        const songTitles = Object.keys(this.records);
        
        if (songTitles.length < 2) {
            throw new Error('Not enough songs for a matchup');
        }
    
        // Get first random song
        let index1 = Math.random() * songTitles.length | 0;
        let song1 = {
            title: songTitles[index1],
            elo: this.records[songTitles[index1]]
        };
        
        // Get second random song by picking from remaining songs
        let remainingIndices = [...Array(songTitles.length).keys()]
            .filter(i => i !== index1);
        let randomIndex = Math.random() * remainingIndices.length | 0;
        let song2 = {
            title: songTitles[remainingIndices[randomIndex]],
            elo: this.records[songTitles[remainingIndices[randomIndex]]]
        };
        
        return [song1, song2];
    }

    checkMatchupCompleted(matchup) {
        return this.#sortedMatchup(matchup) in this.completedMatchups;
    }

    completeMatchup(matchup, winner) {
        this.completedMatchups[this.#sortedMatchup(matchup)] = winner;
        this.records;
    }

    #sortedMatchup(matchup) {
        return matchup.sort((a, b) => a.title.localeCompare(b.title));
    }

    exportJSON() {
        // TODO: return json file of object with records and matchups objects
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Upload button handler
    const uploadButton = document.getElementById('uploadJSON');
    uploadButton.addEventListener('click', openFileSelector);
});
