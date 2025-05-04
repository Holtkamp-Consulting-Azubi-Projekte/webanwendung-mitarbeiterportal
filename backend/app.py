from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import hashlib
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data')
USERS_FILE = os.path.join(DATA_PATH, 'users.json')
SESSION_FILE = os.path.join(DATA_PATH, 'session.json')


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def load_json(path):
    if os.path.exists(path):
        with open(path, 'r') as file:
            try:
                return json.load(file)
            except json.JSONDecodeError:
                return {}
    return {} 


def save_json(data, path):
    with open(path, 'w') as file:
        json.dump(data, file, indent=4)


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email")
    password = data.get("passwort")

    if not email or not password:
        return jsonify({"error": "E-Mail und Passwort sind erforderlich"}), 400

    users = load_json(USERS_FILE)

    if email in users:
        return jsonify({"error": "Benutzer existiert bereits"}), 409

    users[email] = {
        "passwort": hash_password(password),
        "rolle": "user"
    }

    save_json(users, USERS_FILE)
    return jsonify({"message": "Registrierung erfolgreich ✅"}), 200


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    passwort = data.get("passwort")

    if not email or not passwort:
        return jsonify({"error": "E-Mail und Passwort erforderlich"}), 400

    users = load_json(USERS_FILE)
    user = users.get(email)

    if not user:
        return jsonify({"error": "Benutzer nicht gefunden"}), 404

    if hash_password(passwort) != user.get("passwort"):
        return jsonify({"error": "Falsches Passwort"}), 401

    # Session speichern
    sessions = load_json(SESSION_FILE)
    sessions[email] = {
        "loginZeit": datetime.utcnow().isoformat(),
        "rolle": user.get("rolle", "user")
    }
    save_json(sessions, SESSION_FILE)

    return jsonify({
        "message": "Login erfolgreich ✅",
        "email": email,
        "rolle": user.get("rolle", "user")
    }), 200

@app.route("/api/logout", methods=["POST"])
def logout():
    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"error": "E-Mail erforderlich für Logout"}), 400

    sessions = load_json(SESSION_FILE)

    if email in sessions:
        del sessions[email]
        save_json(sessions, SESSION_FILE)
        return jsonify({"message": f"{email} wurde ausgeloggt ✅"}), 200
    else:
        return jsonify({"message": "Benutzer war nicht eingeloggt"}), 200


if __name__ == "__main__":
    app.run(debug=True, port=5050)
