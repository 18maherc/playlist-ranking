from flask import Flask, render_template, request, redirect, url_for, jsonify, Response
import webbrowser
import os
import io
import playlist_manager
import record_manager
import game_manager

app = Flask(__name__)

playlist = playlist_manager.PlaylistManager()
records = record_manager.RecordManager()
elo_game = game_manager.GameManager()


# -------- Pages --------
@app.route('/')
def home():
    return render_template('index.html')


@app.route('/game')
def game():
    return render_template('game.html', song_tuple=(None, None))


# -------- Workflows --------
@app.route('/upload-playlist', methods=['POST'])
def upload_playlist():
    if 'file' not in request.files:
        return 'No file part'
    file = request.files['file']
    if file.filename == '':
        return 'No selected file'
    if file and file.filename.endswith('.json'):
        playlist.upload_playlist(file)
        return redirect(url_for('game'))
    else:
        return 'Invalid file type. Please upload a JSON file.'


@app.route('/upload-records', methods=['POST'])
def upload_records():
    if 'file' not in request.files:
        return 'No file part'
    file = request.files['file']
    if file.filename == '':
        return 'No selected file'
    if file and file.filename.endswith('.json'):
        records.upload_records(file)
        return redirect(url_for('game'))
    else:
        return 'Invalid file type. Please upload a JSON file.'


@app.route('/upload-matchups', methods=['POST'])
def upload_matchups():
    if 'file' not in request.files:
        return 'No file part'
    file = request.files['file']
    if file.filename == '':
        return 'No selected file'
    if file and file.filename.endswith('.json'):
        records.upload_matchups(file)
        return redirect(url_for('game'))
    else:
        return 'Invalid file type. Please upload a JSON file.'


@app.route('/export-file', methods=['GET'])
def export_file():
    selection = request.args.get('selection')
    if selection == 'records':
        export_file = records.export_records()
    elif selection == 'matchups':
        export_file = records.export_matchups()
    else:
        return jsonify({'error': 'Invalid export type'}), 400

    buffer = io.BytesIO()
    buffer.write(export_file.encode('utf-8'))
    buffer.seek(0)

    return Response(buffer, mimetype='application/json', headers={'Content-Disposition': f'attachment;filename={selection}.json'})


@app.route('/create-matchup', methods=['POST'])
def create_matchup():
    matchup = playlist.get_matchup()
    while records.check_matchup_completed(matchup):
        matchup = playlist.get_matchup()
    matchup_strings = elo_game.set_current_matchup(matchup)
    return jsonify(song_tuple=matchup_strings)


@app.route('/song-selection', methods=['POST'])
def song_selection():
    selection = int(request.form['data'])
    result_matchup, result_winner = elo_game.calculate_winner(selection)
    records.complete_matchup(result_matchup, result_winner)
    return create_matchup()


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    if os.getenv('HEROKU_ENV', 'false') != 'true':
        webbrowser.open(f'http://localhost:{port}')
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)
