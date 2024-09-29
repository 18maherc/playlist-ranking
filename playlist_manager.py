import json


class PlaylistManager():
    def __init__(self):
        self.playlist = {}

    def upload_playlist(self, file):
        # TODO: add schema checking to validate this is a list of songs with ELO scores
        self.playlist = json.load(file)
