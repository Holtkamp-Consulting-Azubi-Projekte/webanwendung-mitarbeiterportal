"""
Hauptanwendungsdatei für das Mitarbeiterportal-Backend.
Implementiert die Flask-Anwendung mit allen API-Endpunkten und Konfigurationen.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from auth import register_user, login_user
from flask_jwt_extended import create_access_token, jwt_required, JWTManager, get_jwt_identity
from time_matrix import time_matrix_bp
from database import Database
from datetime import datetime, UTC
import json
import os
import subprocess
from werkzeug.security import generate_password_hash, check_password_hash

# Flask-Anwendung initialisieren
app = Flask(__name__)

# Konfiguration laden
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')

# CORS-Konfiguration für Frontend-Zugriff
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173"],  # Frontend-URL
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# JWT-Konfiguration für Authentifizierung
jwt = JWTManager(app)

# Zeitmatrix-Blueprint registrieren
app.register_blueprint(time_matrix_bp)

# Initialisiere die Datenbank und erstelle die Tabellen
def init_db():
    db = Database()
    try:
        # Prüfe, ob die Tabellen bereits existieren
        result = db.fetch_one("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'h_user'
            );
        """)
        
        if not result or not result[0]:
            # Führe das SQL-Skript aus, um die Tabellen zu erstellen
            subprocess.run(['psql', '-d', 'mitarbeiterportal', '-f', 'init_data_vault.sql'], check=True)
            print("Datenbank-Tabellen wurden erfolgreich erstellt.")
        else:
            print("Datenbank-Tabellen existieren bereits.")
            
    except subprocess.CalledProcessError as e:
        print(f"Fehler beim Erstellen der Tabellen: {e}")
    except Exception as e:
        print(f"Fehler bei der Datenbankinitialisierung: {e}")
    finally:
        db.close()

# Rufe die Initialisierung auf
init_db()

@app.route("/api/ping")  # Optional
def ping():
    """Einfacher Health-Check-Endpunkt."""
    return jsonify({"status": "ok", "message": "Backend läuft"})

@app.route("/api/status")
def status():
    """Systemstatus für Healthcheck."""
    return jsonify({
        "status": "OK",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/register', methods=['POST'])
def register():
    """Registrierungs-Endpunkt für neue Benutzer."""
    return register_user()

@app.route('/api/login', methods=['POST'])
def login():
    """Login-Endpunkt für bestehende Benutzer."""
    return login_user()

@app.route("/api/protected", methods=["GET"])
@jwt_required()
def protected():
    """Geschützter Endpunkt zum Testen der JWT-Authentifizierung."""
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200

@app.route("/api/profile", methods=["GET", "PUT", "OPTIONS"])
@jwt_required()
def profile():
    """
    Profil-Endpunkt für Benutzerdaten.
    GET: Ruft Profildaten des eingeloggten Benutzers ab
    PUT: Aktualisiert Profildaten des eingeloggten Benutzers
    """
    if request.method == "OPTIONS":
        return jsonify({}), 200

    current_user_email = get_jwt_identity()
    db = Database()
    
    try:
        if request.method == "GET":
            # Benutzer aus der Datenbank abrufen
            user = db.get_user_by_email(current_user_email)
            if user:
                user_data = {
                    'firstName': user[2],  # first_name
                    'lastName': user[3],   # last_name
                    'email': user[1],      # user_id
                    'position': user[4],   # position
                    'coreHours': user[5],  # core_hours
                    'telefon': user[6]     # telefon
                }
                return jsonify(user_data), 200
            return jsonify({"error": "Benutzer nicht gefunden"}), 404

        elif request.method == "PUT":
            user = db.get_user_by_email(current_user_email)
            if not user:
                return jsonify({"error": "Benutzer nicht gefunden"}), 404

            # Update-Daten aus dem Request
            update_data = request.json
            
            # Erlaubte Felder für das Update
            allowed_fields = ['firstName', 'lastName', 'position', 'coreHours', 'telefon']
            
            # Aktualisiere Benutzerdetails
            db.update_user_details(user[0], update_data)  # user[0] ist hk_user

            return jsonify({"message": "Profil erfolgreich aktualisiert"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@app.route("/api/change-password", methods=["PUT", "OPTIONS"])
@jwt_required()
def change_password():
    """
    Endpunkt zum Ändern des Benutzerpassworts.
    Erfordert das aktuelle Passwort und das neue Passwort.
    """
    if request.method == "OPTIONS":
        return jsonify({}), 200

    current_user_email = get_jwt_identity()
    data = request.json
    current_password = data.get('currentPassword')
    new_password = data.get('newPassword')

    if not current_password or not new_password:
        return jsonify({"error": "Aktuelles und neues Passwort sind erforderlich"}), 400

    db = Database()
    try:
        user = db.get_user_by_email(current_user_email)
        if not user:
            return jsonify({"error": "Benutzer nicht gefunden"}), 404

        # Passwort-Validierung
        if len(new_password) < 8:
            return jsonify({"error": "Neues Passwort muss mindestens 8 Zeichen lang sein"}), 400

        # Überprüfe aktuelles Passwort
        if not check_password_hash(user[7], current_password):  # password_hash ist das 8. Feld
            return jsonify({"error": "Aktuelles Passwort ist falsch"}), 401

        # Neues Passwort hashen
        new_password_hash = generate_password_hash(new_password)

        # Passwort aktualisieren
        db.update_password(user[0], new_password_hash)  # user[0] ist hk_user

        return jsonify({"message": "Passwort erfolgreich geändert"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@app.route("/api/projects", methods=["GET", "OPTIONS"])
@jwt_required()
def get_projects():
    """
    Endpunkt zum Abrufen der verfügbaren Projekte.
    Lädt Projekte aus der Datenbank.
    """
    if request.method == "OPTIONS":
        return jsonify({}), 200
        
    db = Database()
    try:
        # Projekte aus der Datenbank laden
        projects = db.get_projects()
        project_list = [project[0] for project in projects]  # project_name ist das erste Feld
        return jsonify(project_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

if __name__ == "__main__":
    app.run(debug=True, port=5050)
