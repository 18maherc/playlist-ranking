import json
import random


class PlaylistManager():
    def __init__(self):
        self.playlist = {}
        self.song_list = []

    def upload_playlist(self, file):
        # TODO: add schema checking to validate this is a list of songs with ELO scores
        self.playlist = json.load(file)
        self.song_list = []
        for song, score in self.playlist.items():
            self.song_list.append(Song(song, score))

    def get_matchup(self) -> tuple:
        first = random.randint(0, len(self.song_list))
        second = random.randint(0, len(self.song_list))
        while second == first:
            second = random.randint(0, len(self.song_list))
        song1 = self.song_list[first]
        song2 = self.song_list[second]
        return song1, song2

    def get_song_elo(self, song_name) -> float:
        for song in self.song_list:
            if song.name == song_name:
                return song.elo
        return None


class Song():
    def __init__(self, name: str, elo: float) -> None:
        self.name = name
        self.elo = elo
        self.json_object = {name: elo}
