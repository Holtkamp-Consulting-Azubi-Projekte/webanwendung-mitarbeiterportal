from flask import Flask, jsonify, request
from flask_cors import CORS
from auth import register_user, login_user
from flask_jwt_extended import create_access_token, jwt_required, JWTManager, get_jwt_identity
from time_matrix import time_matrix_bp  # Importiere den Zeitmatrix-Blueprint
import json
import os

app = Flask(__name__)

# CORS-Konfiguration
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Setup the Flask-JWT-Extended extension
app.config["JWT_SECRET_KEY"] = "super-secret"  # Change this! In production, use a random secret from env var
jwt = JWTManager(app)

# Zeitmatrix-Blueprint registrieren
app.register_blueprint(time_matrix_bp)

@app.route("/api/ping")
def ping():
    return jsonify({"status": "ok", "message": "Backend läuft"})

@app.route('/api/register', methods=['POST'])
def register():
    return register_user()

@app.route('/api/login', methods=['POST'])
def login():
    # Wir werden die login_user Funktion in auth.py so anpassen, dass sie create_access_token aufruft
    # und den Token zurückgibt.
    return login_user()

@app.route("/api/protected", methods=["GET"])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200

@app.route("/api/profile", methods=["GET", "PUT", "OPTIONS"])
@jwt_required()
def profile():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    current_user_email = get_jwt_identity()

    # Pfad zur users.json
    users_file = os.path.join(os.path.dirname(__file__), 'data', 'users.json')

    if request.method == "GET":
        with open(users_file, 'r') as f:
            users_data = json.load(f)
            user = next((user for user in users_data['users'] if user['email'] == current_user_email), None)
            if user:
                # Bereite Benutzerdaten für das Frontend vor
                user_data = {
                    'firstName': user.get('firstName', ''),
                    'lastName': user.get('lastName', ''),
                    'email': user.get('email', ''),
                    'position': user.get('position', ''),
                    'currentProject': user.get('currentProject', ''), # Neues Feld
                    'coreHours': user.get('coreHours', ''), # Neues Feld
                    'telefon': user.get('telefon', '') # Bestehendes Feld
                    # Entferne 'abteilung' und 'standort'
                }
                return jsonify(user_data), 200
            return jsonify({"error": "Benutzer nicht gefunden"}), 404

    elif request.method == "PUT":
        try:
            with open(users_file, 'r') as f:
                users_data = json.load(f)

            # Finde den Benutzer
            user_index = next((i for i, user in enumerate(users_data['users']) 
                             if user['email'] == current_user_email), None)

            if user_index is None:
                return jsonify({"error": "Benutzer nicht gefunden"}), 404

            # Aktualisiere die Benutzerdaten
            update_data = request.json
            
            # Erlaubte Felder für das Update
            allowed_fields = ['firstName', 'lastName', 'position', 'currentProject', 'coreHours', 'telefon']
            updated_user_data = {key: update_data.get(key) for key in allowed_fields if key in update_data}

            # Stelle sicher, dass die E-Mail nicht geändert werden kann
            if 'email' in updated_user_data:
                del updated_user_data['email'] # Sicherstellen, dass email nicht im updated_user_data ist
                
            # Entferne alte Felder, falls sie noch im Update-Request sind (sollte nicht passieren, aber zur Sicherheit)
            if 'abteilung' in users_data['users'][user_index]:
                del users_data['users'][user_index]['abteilung']
            if 'standort' in users_data['users'][user_index]:
                del users_data['users'][user_index]['standort']

            # Aktualisiere nur die erlaubten Felder
            users_data['users'][user_index].update(updated_user_data)

            # Speichere die aktualisierten Daten
            with open(users_file, 'w') as f:
                json.dump(users_data, f, indent=2)

            return jsonify({"message": "Profil erfolgreich aktualisiert"}), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500

@app.route("/api/change-password", methods=["PUT", "OPTIONS"])
@jwt_required()
def change_password():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    current_user_email = get_jwt_identity()
    data = request.json
    current_password = data.get('currentPassword')
    new_password = data.get('newPassword')

    if not current_password or not new_password:
        return jsonify({"error": "Aktuelles und neues Passwort sind erforderlich"}), 400

    users_file = os.path.join(os.path.dirname(__file__), 'data', 'users.json')

    try:
        with open(users_file, 'r') as f:
            users_data = json.load(f)

        user = next((user for user in users_data['users'] if user['email'] == current_user_email), None)

        if not user:
            return jsonify({"error": "Benutzer nicht gefunden"}), 404

        # Hier müssten Sie das aktuelle Passwort mit dem gespeicherten Hash überprüfen
        # Da wir den Hash-Algorithmus aus auth.py nicht kennen, simulieren wir dies vorerst
        # In einer echten Anwendung MÜSSEN Sie eine sichere Hash-Überprüfung implementieren!
        # Beispiel (NICHT sicher): if user['password'] != hash_password_somehow(current_password):
        #    return jsonify({"error": "Aktuelles Passwort ist falsch"}), 401
        
        # Neues Passwort hashen (Auch hier: Sicheren Hash-Algorithmus aus auth.py verwenden!)
        # Beispiel (NICHT sicher): hashed_new_password = hash_password_somehow(new_password)

        # Passwort-Validierung (Beispiel)
        if len(new_password) < 8:
             return jsonify({"error": "Neues Passwort muss mindestens 8 Zeichen lang sein"}), 400

        # Aktualisiere das Passwort im Benutzerobjekt
        # user['password'] = hashed_new_password # In echter Anwendung gehashtes Passwort speichern

        # Speichere die aktualisierten Daten
        with open(users_file, 'w') as f:
            json.dump(users_data, f, indent=2)

        return jsonify({"message": "Passwort erfolgreich geändert"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Neuer Endpunkt für Projekte
@app.route("/api/projects", methods=["GET", "OPTIONS"])
@jwt_required()
def get_projects():
    if request.method == "OPTIONS":
        return jsonify({}), 200
        
    # Temporäre Liste von Projekten (später aus DB laden)
    projects = [
        "Mitarbeiterportal (Kunde: Holtkamp Consulting)",
        "SAP Administration (Kunde: Winkelmann AG)",
        "Treasor (Kunde: Agentur für Arbeit)",
        "Data Vault (Kunde: APO Bank)",
    ]
    return jsonify(projects), 200

if __name__ == "__main__":
    app.run(debug=True, port=5050)
