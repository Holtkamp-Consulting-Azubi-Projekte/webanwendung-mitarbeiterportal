from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import os
import json

auth_bp = Blueprint('auth', __name__)
USERS_FILE = 'data/users.json'
SESSION_FILE = 'data/session.json'


def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, 'r') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}


def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=4)


def save_session(session_data):
    with open(SESSION_FILE, 'w') as f:
        json.dump(session_data, f, indent=4)


@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({'message': 'Keine Daten erhalten'}), 400

        email = data.get('email')
        if not email or not data.get('passwort'):
            return jsonify({'message': 'E-Mail und Passwort erforderlich'}), 400

        users = load_users()

        if email in users:
            return jsonify({'message': 'Benutzer existiert bereits'}), 400

        users[email] = {
            'vorname': data.get('vorname', ''),
            'nachname': data.get('nachname', ''),
            'passwort': generate_password_hash(data.get('passwort')),
            'rolle': data.get('rolle', 'Mitarbeiter')
        }

        save_users(users)
        return jsonify({'message': 'Registrierung erfolgreich'}), 200

    except Exception as e:
        print("Fehler in /register:", e)
        return jsonify({'message': f'Fehler: {str(e)}'}), 500
