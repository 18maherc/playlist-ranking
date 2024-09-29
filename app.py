from flask import Flask, render_template, request, redirect, url_for
import webbrowser
import os
import playlist_manager

app = Flask(__name__)

playlist = playlist_manager.PlaylistManager()


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/upload-playlist', methods=['POST'])
def upload_playlist():
    if 'file' not in request.files:
        return 'No file part'
    file = request.files['file']
    if file.filename == '':
        return 'No selected file'
    if file and file.filename.endswith('.json'):
        playlist.upload_playlist(file)
        return redirect(url_for('home'))
    else:
        return 'Invalid file type. Please upload a JSON file.'


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    if os.getenv('HEROKU_ENV', 'false') != 'true':
        webbrowser.open(f'http://localhost:{port}')
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)
