import json
import random


class PlaylistManager():
    def __init__(self):
        self.playlist = {}

    def upload_playlist(self, file):
        # TODO: add schema checking to validate this is a list of songs with ELO scores
        self.playlist = json.load(file)

    def get_matchup(self) -> tuple:
        song_list = list(self.playlist.keys())
        random.shuffle(song_list)

        first = random.randint(0, 126)
        second = random.randint(0, 126)
        while second == first:
            second = random.randint(0, 126)
        song1 = song_list[first]
        song2 = song_list[second]

        return song1, song2
