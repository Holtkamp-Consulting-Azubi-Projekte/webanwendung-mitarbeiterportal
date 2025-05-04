from flask import Flask, request, jsonify
import json
from pathlib import Path
from datetime import datetime
from flask_cors import CORS


app = Flask(__name__)
CORS(app)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
USERS_FILE = DATA_DIR / "users.json"

@app.route("/api/register", methods=["POST"])
def register():
    daten = request.json
    email = daten.get("email")
    passwort = daten.get("passwort")

    if not email or not passwort:
        return jsonify({"fehler": "E-Mail und Passwort erforderlich"}), 400

    # Lade bestehende Benutzer
    if USERS_FILE.exists():
        with open(USERS_FILE, "r") as f:
            users = json.load(f)
    else:
        users = {}

    if email in users:
        return jsonify({"fehler": "Benutzer existiert bereits"}), 409

    # Neuen Benutzer speichern
    users[email] = {
        "passwort": passwort,
        "rolle": "user",
        "registriertAm": datetime.utcnow().isoformat()
    }

    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

    return jsonify({"nachricht": "Registrierung erfolgreich"}), 201

@app.route("/api/login", methods=["POST"])
def login():
    daten = request.json
    email = daten.get("email")
    passwort = daten.get("passwort")

    if not email or not passwort:
        return jsonify({"fehler": "E-Mail und Passwort erforderlich"}), 400

    # Lade Benutzer
    if USERS_FILE.exists():
        with open(USERS_FILE, "r") as f:
            users = json.load(f)
    else:
        return jsonify({"fehler": "Benutzer-Datenbank fehlt"}), 500

    user = users.get(email)

    if not user or user.get("passwort") != passwort:
        return jsonify({"fehler": "Ungültige Anmeldedaten"}), 401

    # Login erfolgreich – Session optional speichern
    return jsonify({
        "nachricht": "Login erfolgreich",
        "email": email,
        "rolle": user.get("rolle", "user")
    }), 200


if __name__ == "__main__":
    app.run(debug=True)
