class GameManager():
    def __init__(self):
        self.current_matchup = (None, None)

    def _calculate_elo(self, winner_elo, loser_elo, k=32):
        expected_winner = 1 / (1 + 10 ** ((loser_elo - winner_elo) / 400))
        expected_loser = 1 / (1 + 10 ** ((winner_elo - loser_elo) / 400))

        new_winner_elo = winner_elo + k * (1 - expected_winner)
        new_loser_elo = loser_elo + k * (0 - expected_loser)

        return new_winner_elo, new_loser_elo

    def get_current_matchup(self) -> tuple:
        return self.current_matchup

    def set_current_matchup(self, matchup: tuple) -> tuple[str, str]:
        self.current_matchup = matchup
        return self.current_matchup[0].name, self.current_matchup[1].name

    def calculate_winner(self, win_choice: int) -> tuple[tuple, str]:
        if win_choice:
            winning_song = self.current_matchup[1]
            losing_song = self.current_matchup[0]
        else:
            winning_song = self.current_matchup[0]
            losing_song = self.current_matchup[1]

        winning_song.elo, losing_song.elo = self._calculate_elo(
            winning_song.elo, losing_song.elo)

        return self.current_matchup, winning_song.name
