from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import hashlib

app = Flask(__name__)
CORS(app)

DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data')
USERS_FILE = os.path.join(DATA_PATH, 'users.json')


def hash_password(password: str) -> str:
    """Hasht das Passwort mit SHA256."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r') as file:
            return json.load(file)
    return {}


def save_users(users):
    with open(USERS_FILE, 'w') as file:
        json.dump(users, file, indent=4)


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email")
    password = data.get("passwort")

    if not email or not password:
        return jsonify({"error": "E-Mail und Passwort sind erforderlich"}), 400

    users = load_users()

    if email in users:
        return jsonify({"error": "Benutzer existiert bereits"}), 409

    users[email] = {
        "passwort": hash_password(password)
    }

    save_users(users)
    return jsonify({"message": "Registrierung erfolgreich ✅"}), 200

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    passwort = data.get("passwort")

    if not email or not passwort:
        return jsonify({"error": "E-Mail und Passwort erforderlich"}), 400

    users = load_users()
    user = users.get(email)

    if not user:
        return jsonify({"error": "Benutzer nicht gefunden"}), 404

    eingegebener_hash = hash_password(passwort)
    gespeicherter_hash = user.get("passwort")

    if eingegebener_hash != gespeicherter_hash:
        return jsonify({"error": "Falsches Passwort"}), 401

    return jsonify({
        "message": "Login erfolgreich ✅",
        "email": email
    }), 200


if __name__ == "__main__":
    app.run(debug=True, port=5050)
