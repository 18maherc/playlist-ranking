import json


class RecordManager():
    def __init__(self):
        self.song_records = {}
        self.completed_matchups = {}

    def upload_records(self, file):
        # TODO: add schema checking to validate this is a list of songs with ELO scores
        self.song_records = json.load(file)

    def upload_matchups(self, file):
        # TODO: add schema checking to validate this is a list of songs with ELO scores
        self.completed_matchups = json.load(file)
