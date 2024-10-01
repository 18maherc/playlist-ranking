import json


class RecordManager():
    def __init__(self):
        self.song_records = {}
        self.completed_matchups = {}

    def upload_records(self, file):
        # TODO: add schema checking to validate this is a list of songs with H2H records
        self.song_records = json.load(file)

    def upload_matchups(self, file):
        # TODO: add schema checking to validate this is a list of completed H2H matchups
        self.completed_matchups = json.load(file)

    def check_matchup_completed(self, matchup: tuple) -> bool:
        return tuple(song.name for song in self._sorted_matchup(matchup)) in self.completed_matchups

    def complete_matchup(self, matchup: tuple, winner: str):
        self.completed_matchups[self._sorted_matchup(matchup)] = winner
        # TODO: update records for each song in the matchup

    def _sorted_matchup(self, matchup: tuple) -> tuple[str, str]:
        return tuple(sorted(matchup, key=lambda song: song.name))

    # def export_matchups(self, file):
    #   json_serializable_dict = {str(k): v for k, v in song_dict.items()}
    #   json.dump(json_serializable_dict, file, indent=4)
