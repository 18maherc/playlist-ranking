// gameManager.js
let gameManager = null;

function songSelection(selection) {
    if (currentPlaylistManager) {
        // Get current matchup
        const currentMatchup = gameManager.getCurrentMatchup();

        const result = gameManager.calculateWinner(selection);
        if (!result) {
            console.error('Failed to calculate winner');
            return;
        }

        // Record the winner
        currentPlaylistManager.completeMatchup(currentMatchup, result);
        
        // Get and display next matchup
        const nextMatchup = currentPlaylistManager.getMatchup();
        displayMatchup(nextMatchup);
    }
}

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
        if (!this.currentMatchup || !this.currentMatchup[0] || !this.currentMatchup[1]) {
            console.error('Invalid matchup data:', this.currentMatchup);
            return null;
        }

        let winningSong = this.currentMatchup[winChoice];
        let losingSong = this.currentMatchup[1 - winChoice];

        const eloUpdate = this.#calculateElo(winningSong.elo, losingSong.elo);

        winningSong.elo = eloUpdate.winner;
        losingSong.elo = eloUpdate.loser;

        return {
            winner: winningSong,
            loser: losingSong,
            newElos: eloUpdate
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    gameManager = new GameManager()
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
