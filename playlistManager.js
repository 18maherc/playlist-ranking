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
                    const playlistManager = new PlaylistManager();
                    playlistManager.uploadPlaylist(jsonData);
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
    if (currentPlaylistManager) {
        // Get matchup elements
        const matchup = currentPlaylistManager.getMatchup();
        
        // Update UI with the matchup
        displayMatchup(matchup);
    }
}

function displayMatchup(matchup) {
    const [song1, song2] = matchup;
    
    // Update UI elements with song1 and song2
    document.getElementById('song1-title').textContent = song1.title;
    document.getElementById('song2-title').textContent = song2.title;
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

function displayMatchup(matchup) {
    const [song1, song2] = matchup;
    
    // Update the card contents
    document.querySelector('.song1 .title').textContent = song1.title;
    document.querySelector('.song1 + p b').textContent = song1.elo;
    
    document.querySelector('.song2 .title').textContent = song2.title;
    document.querySelector('.song2 + p b').textContent = song2.elo;
}
