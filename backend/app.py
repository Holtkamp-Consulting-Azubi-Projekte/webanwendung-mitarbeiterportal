from flask import Flask, request, jsonify
from flask_cors import CORS
import os, json, hashlib
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

# 📁 Pfade
BASE = os.path.abspath(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE, '..', 'data')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
SESSION_FILE = os.path.join(DATA_DIR, 'session.json')
TIMES_FILE = os.path.join(DATA_DIR, 'times.json')
PROJECTS_FILE = os.path.join(DATA_DIR, 'projects.json')

os.makedirs(DATA_DIR, exist_ok=True)

# 🔐 Passwort-Hashing
def hash_password(passwort: str) -> str:
    return hashlib.sha256(passwort.encode("utf-8")).hexdigest()

# 🔄 JSON-Handling
def load_json(pfad):
    if not os.path.exists(pfad):
        with open(pfad, "w", encoding="utf-8") as f:
            json.dump({}, f)
    with open(pfad, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json(daten, pfad):
    with open(pfad, "w", encoding="utf-8") as f:
        json.dump(daten, f, indent=2, ensure_ascii=False)

# ✅ Registrierung
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    users = load_json(USERS_FILE)
    email = data.get("email")
    if email in users:
        return jsonify({"error": "Benutzer existiert bereits"}), 409

    users[email] = {
        "vorname": data.get("vorname", ""),
        "nachname": data.get("nachname", ""),
        "rolle": data.get("rolle", "user"),
        "eintrittsdatum": data.get("eintrittsdatum", ""),
        "adresse": data.get("adresse", ""),
        "telefon": data.get("telefon", ""),
        "passwort": hash_password(data.get("passwort", ""))
    }
    save_json(users, USERS_FILE)
    return jsonify({"message": "Registrierung erfolgreich"}), 201

# ✅ Login
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    users = load_json(USERS_FILE)
    email = data.get("email")
    pw = hash_password(data.get("passwort", ""))
    if email in users and users[email]["passwort"] == pw:
        save_json({"email": email, "login": datetime.now().isoformat()}, SESSION_FILE)
        return jsonify({"message": "Login erfolgreich"}), 200
    return jsonify({"error": "Login fehlgeschlagen"}), 401

# ✅ Logout
@app.route("/api/logout", methods=["POST"])
def logout():
    save_json({}, SESSION_FILE)
    return jsonify({"message": "Logout erfolgreich"}), 200

# ✅ Benutzerprofil abrufen/bearbeiten
@app.route("/api/user/<email>", methods=["GET", "PUT"])
def user(email):
    users = load_json(USERS_FILE)
    if email not in users:
        return jsonify({"error": "Benutzer nicht gefunden"}), 404

    if request.method == "GET":
        return jsonify(users[email]), 200

    if request.method == "PUT":
        daten = request.get_json()
        users[email].update({
            "vorname": daten.get("vorname", ""),
            "nachname": daten.get("nachname", ""),
            "rolle": daten.get("rolle", ""),
            "eintrittsdatum": daten.get("eintrittsdatum", ""),
            "adresse": daten.get("adresse", ""),
            "telefon": daten.get("telefon", "")
        })
        save_json(users, USERS_FILE)
        return jsonify({"message": "Profil aktualisiert"}), 200

# ✅ Projekte verwalten
@app.route("/api/projekte", methods=["GET", "POST"])
def projekte():
    projekte = load_json(PROJECTS_FILE)
    zeiten = load_json(TIMES_FILE)

    if request.method == "GET":
        # Status dynamisch prüfen
        for pid, projekt in projekte.items():
            if projekt.get("status") == "abgeschlossen":
                continue  # Nicht anfassen

            name = projekt.get("name")
            offen = any(
                z.get("projekt") == name and z.get("end") is None
                for z in zeiten.values()
            )
            projekte[pid]["status"] = "aktiv" if offen else "inaktiv"

        return jsonify(projekte), 200

    if request.method == "POST":
        data = request.get_json()
        id = datetime.now().isoformat()
        data["status"] = "inaktiv"
        projekte[id] = data
        save_json(projekte, PROJECTS_FILE)
        return jsonify({id: data}), 201

# ✅ Projekte bearbeiten/löschen
@app.route("/api/projekte/<projekt_id>", methods=["PUT", "DELETE"])
def projekt_aktualisieren_oder_loeschen(projekt_id):
    projekte = load_json(PROJECTS_FILE)
    zeiten = load_json(TIMES_FILE)

    if projekt_id not in projekte:
        return jsonify({"error": "Projekt nicht gefunden"}), 404

    if request.method == "PUT":
        daten = request.get_json()
        projekte[projekt_id].update(daten)
        save_json(projekte, PROJECTS_FILE)
        return jsonify({projekt_id: projekte[projekt_id]}), 200

    if request.method == "DELETE":
        projektname = projekte[projekt_id]["name"]
        aktive_zeiten = [
            z for z in zeiten.values()
            if z["projekt"] == projektname and z["end"] is None
        ]
        if aktive_zeiten:
            return jsonify({"error": "Projekt ist aktiv und kann nicht gelöscht werden."}), 400

        del projekte[projekt_id]
        save_json(projekte, PROJECTS_FILE)
        return jsonify({"message": "Projekt gelöscht"}), 200

# ✅ Zeiterfassung
@app.route("/api/zeiten", methods=["GET"])
def get_zeiten():
    return jsonify(load_json(TIMES_FILE)), 200

@app.route("/api/zeiten/start", methods=["POST"])
def start_zeit():
    data = request.get_json()
    zeiten = load_json(TIMES_FILE)
    projekte = load_json(PROJECTS_FILE)

    start = data.get("start")
    projekt_name = data.get("projekt")

    zeiten[start] = {
        "email": data.get("email"),
        "start": start,
        "end": None,
        "projekt": projekt_name
    }
    save_json(zeiten, TIMES_FILE)

    # Projektstatus auf "aktiv" setzen (wenn bisher "inaktiv")
    for pid, p in projekte.items():
        if p["name"] == projekt_name and p.get("status") == "inaktiv":
            projekte[pid]["status"] = "aktiv"
            save_json(projekte, PROJECTS_FILE)
            break

    return jsonify({"message": "Startzeit erfasst"}), 201

@app.route("/api/zeiten/stop", methods=["POST"])
def stop_zeit():
    data = request.get_json()
    zeiten = load_json(TIMES_FILE)
    email = data.get("email")
    end = data.get("end")

    offene = [(k, v) for k, v in zeiten.items() if v["email"] == email and v.get("end") is None]
    if not offene:
        return jsonify({"error": "Keine offene Zeit gefunden"}), 404

    key = sorted(offene)[-1][0]
    zeiten[key]["end"] = end
    save_json(zeiten, TIMES_FILE)
    return jsonify(zeiten[key]), 200

# ✅ Server starten
if __name__ == "__main__":
    app.run(debug=True, port=5050)
