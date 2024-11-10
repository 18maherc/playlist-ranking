// gameManager.js

class GameManager {
    constructor() {
        this.currentMatchup = [null, null];
        this.K = 32; // ELO constant
    }

    getCurrentMatchup() {
        return this.currentMatchup;
    }

    setCurrentMatchup(matchup) {
        this.currentMatchup = matchup;
    }

    #calculateElo(winnerELO, loserELO) {
        let expectedWinner = 1 / (1 + Math.pow(10, (loserELO - winnerELO) / 400));
        let expectedLoser = 1 / (1 + Math.pow(10, (winnerELO - loserELO) / 400));

        let newWinnerELO = Math.round(winnerELO + this.K * (1 - expectedWinner));
        let newLoserELO = Math.round(loserELO + this.K * (0 - expectedLoser));

        return {
            winner: newWinnerELO,
            loser: newLoserELO
        };
    }

    calculateWinner(winChoice){
        let winningSong = this.currentMatchup[winChoice];
        let losingSong = this.currentMatchup[1 - winChoice];

        const eloUpdate = this.#calculateElo(winningSong.elo, losingSong.elo);

        winningSong.elo = eloUpdate.winner;
        losingSong.elo = eloUpdate.loser;

        return winningSong;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Add click handlers for the song cards
    const card1 = document.querySelector('.card1');
    const card2 = document.querySelector('.card2');

    card1.addEventListener('click', () => {
        songSelection(0);
    });

    card2.addEventListener('click', () => {
        songSelection(1);
    });
});

function songSelection(selection) {
    if (currentPlaylistManager) {
        // Get current matchup
        const currentMatchup = [
            {
                title: document.querySelector('.song1 .title').textContent,
                elo: parseInt(document.querySelector('.song1 + p b').textContent)
            },
            {
                title: document.querySelector('.song2 .title').textContent,
                elo: parseInt(document.querySelector('.song2 + p b').textContent)
            }
        ];

        // Record the winner
        currentPlaylistManager.completeMatchup(currentMatchup, currentMatchup[selection]);
        
        // Get and display next matchup
        const nextMatchup = currentPlaylistManager.getMatchup();
        displayMatchup(nextMatchup);
    }
}
