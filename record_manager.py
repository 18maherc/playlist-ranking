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
        return self._sorted_matchup(matchup) in self.completed_matchups

    def complete_matchup(self, matchup: tuple, winner: str):
        self.completed_matchups[self._sorted_matchup(matchup)] = winner
        # TODO: update records for each song in the matchup

    def _sorted_matchup(self, matchup: tuple) -> tuple[str, str]:
        sorted_matchup = sorted(matchup, key=lambda song: song.name)
        return tuple(song.name for song in sorted_matchup)

    def export_records(self):
        json_serializable_dict = {
            str(k): v for k, v in self.song_records.items()}
        return json.dumps(json_serializable_dict, indent=4)

    def export_matchups(self):
        json_serializable_dict = {
            str(k): v for k, v in self.completed_matchups.items()}
        return json.dumps(json_serializable_dict, indent=4)
