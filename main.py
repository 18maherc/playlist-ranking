import json
import random


# Function to calculate ELO rating
def calculate_elo(winner_elo, loser_elo, k=32):
    expected_winner = 1 / (1 + 10 ** ((loser_elo - winner_elo) / 400))
    expected_loser = 1 / (1 + 10 ** ((winner_elo - loser_elo) / 400))

    new_winner_elo = winner_elo + k * (1 - expected_winner)
    new_loser_elo = loser_elo + k * (0 - expected_loser)

    return new_winner_elo, new_loser_elo


# Function to save records
def save_records(filename, data):
    with open(filename, 'w') as f:
        json.dump(data, f, indent=4)


# Function to load records
def load_records(filename):
    try:
        with open(filename, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


# Simulate a round-robin matchup
def round_robin_matchup(songs):
    song_list = list(songs.keys())
    random.shuffle(song_list)

    while True:
        first = random.randint(0, 126)
        second = random.randint(0, 126)
        while second == first:
            second = random.randint(0, 126)
        song1 = song_list[first]
        song2 = song_list[second]

        # Check if this matchup has already been completed
        matchup = tuple(sorted([song1, song2]))
        if matchup in completed_matchups:
            continue

        # Simulate a match (you can replace this with actual user input)
        choice = input(f"{song1} (0) vs {song2} (1): ")
        if choice == 'q':
            print("Closing script")
            break
        elif choice == '0':
            winner = song1
            loser = song2
        elif choice == '1':
            winner = song2
            loser = song1
        else:
            print("Invalid character")
            continue

        # Calculate new ELO ratings
        new_winner_elo, new_loser_elo = calculate_elo(
            records[winner]['elo'], records[loser]['elo'])

        # Update records
        records[winner]['elo'] = new_winner_elo
        records[winner]['matches'] += 1
        records[winner]['wins'] += 1

        records[loser]['elo'] = new_loser_elo
        records[loser]['matches'] += 1
        records[loser]['losses'] += 1

        # Sort the records dictionary by ELO in descending order
        sorted_records = dict(
            sorted(records.items(), key=lambda item: item[1]['elo'], reverse=True))

        # Record the completed matchup
        completed_matchups[str(matchup)] = winner

        print(
            f"{winner} (new ELO: {new_winner_elo:.2f}) defeated {loser} (new ELO: {new_loser_elo:.2f})")

        # Save updated records and matchups
        save_records('song_records.json', sorted_records)
        save_records('completed_matchups.json', completed_matchups)


# --------- Script time ----------
# Initialize songs with starting ELO scores
with open("discography.json", 'r') as file:
    songs = json.load(file)

# Load previous records
records = load_records('song_records.json')

# Update records with new songs if not already present
for song in songs:
    if song not in records:
        records[song] = {'elo': songs[song],
                         'matches': 0, 'wins': 0, 'losses': 0}

# Load previous matchups
completed_matchups = load_records('completed_matchups.json')

# Run the round-robin matchup
round_robin_matchup(songs)
