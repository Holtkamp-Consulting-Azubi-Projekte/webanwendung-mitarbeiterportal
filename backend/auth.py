from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from log import log_event
from database import Database
import hashlib
import traceback

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/api/ping")
def ping():
    return jsonify({"status": "ok", "message": "Backend läuft"})

@auth_bp.route("/api/status")
def status():
    return jsonify({
        "status": "OK",
        "timestamp": datetime.now().isoformat()
    })

@auth_bp.route('/api/register', methods=['POST'])
def register():
    """Registrierungs-Endpunkt für neue Benutzer."""
    print("Registrierungs-Versuch gestartet")
    data = request.get_json()
    print(f"Empfangene Daten: {data}")
    required_fields = ['email', 'password', 'firstName', 'lastName']
    if not all(field in data for field in required_fields):
        print("Fehlende Felder im Registrierungs-Request")
        log_event('registration_failed', details={'reason': 'missing_fields', 'email': data.get('email')})
        return jsonify({
            'success': False,
            'message': 'Alle Felder sind erforderlich'
        }), 400
    try:
        db = Database()
        existing_user = db.get_user_by_email(data['email'])
        if existing_user:
            print("E-Mail bereits registriert")
            log_event('registration_failed', details={'email': data['email'], 'reason': 'email_already_registered'})
            return jsonify({
                'success': False,
                'message': 'Diese E-Mail-Adresse ist bereits registriert'
            }), 400
        print("Erstelle neuen Benutzer...")
        password_hash = generate_password_hash(data['password'])
        db.insert_user(
            data['email'],
            data['firstName'],
            data['lastName'],
            password_hash
        )
        log_event('registration_success', user_id=data['email'])
        print("Registrierung erfolgreich abgeschlossen")
        db.close()
        return jsonify({
            'success': True,
            'message': 'Registrierung erfolgreich'
        }), 201
    except Exception as e:
        print(f"Fehler bei der Registrierung: {e}")
        log_event('registration_failed', details={'reason': 'internal_error', 'email': data.get('email'), 'error': str(e)})
        return jsonify({
            'success': False,
            'message': 'Ein interner Fehler ist bei der Registrierung aufgetreten.\n' + str(e)
        }), 500

@auth_bp.route('/api/login', methods=['POST'])
def login():
    """Login-Endpunkt für bestehende Benutzer."""
    print("Login-Versuch gestartet")
    data = request.get_json()
    print(f"Empfangene Daten: {data}")
    if not all(field in data for field in ['email', 'password']):
        print("Fehlende Felder im Login-Request")
        log_event('login_failed', details={'email': data.get('email'), 'reason': 'missing_fields'})
        return jsonify({
            'success': False,
            'message': 'E-Mail und Passwort sind erforderlich'
        }), 400
    try:
        db = Database()
        user = db.get_user_by_email(data['email'])
        print(f"Gefundener Benutzer: {user}")
        if not user:
            print("Benutzer nicht gefunden")
            log_event('login_failed', details={'email': data['email'], 'reason': 'email_not_registered'})
            return jsonify({
                'success': False,
                'message': 'Diese E-Mail-Adresse ist nicht registriert. Bitte registrieren Sie sich zuerst.'
            }), 401
        print("Überprüfe Passwort...")
        if user[7] is None:
            print("Kein Passwort-Hash für Benutzer gefunden")
            log_event('login_failed', user_id=user[1], details={'reason': 'no_password_hash'})
            return jsonify({
                'success': False,
                'message': 'Kein Passwort für diesen Benutzer gespeichert. Bitte wenden Sie sich an den Administrator.'
            }), 400
        if not check_password_hash(user[7], data['password']):
            print("Falsches Passwort")
            log_event('login_failed', user_id=user[1], details={'reason': 'incorrect_password'})
            return jsonify({
                'success': False,
                'message': 'Falscher Benutzername oder Passwort'
            }), 401
        print("Login erfolgreich, erstelle JWT...")
        access_token = create_access_token(identity=user[1])
        log_event('login_success', user_id=user[1])
        db.close()
        return jsonify({
            'success': True,
            'message': 'Login erfolgreich',
            'access_token': access_token
        }), 200
    except Exception as e:
        print(f"Fehler beim Login: {e}")
        traceback.print_exc()
        log_event('login_failed', details={'reason': 'internal_error', 'error': str(e)})
        return jsonify({
            'success': False,
            'message': 'Ein interner Fehler ist aufgetreten'
        }), 500

@auth_bp.route("/api/protected", methods=["GET"])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200

@auth_bp.route("/api/profile", methods=["GET", "PUT", "OPTIONS"])
@jwt_required()
def profile():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    current_user_email = get_jwt_identity()
    db = Database()
    try:
        if request.method == "GET":
            user = db.get_user_by_email(current_user_email)
            if user:
                user_data = {
                    'firstName': user[2],
                    'lastName': user[3],
                    'email': user[1],
                    'position': user[4],
                    'coreHours': user[5],
                    'telefon': user[6],
                    'passwordHash': user[7],
                    'currentProject': user[8]
                }
                return jsonify(user_data), 200
            return jsonify({"error": "Benutzer nicht gefunden"}), 404
        elif request.method == "PUT":
            user = db.get_user_by_email(current_user_email)
            if not user:
                return jsonify({"error": "Benutzer nicht gefunden"}), 404
            update_data = request.json
            if "currentProject" in update_data:
                update_data["current_project"] = update_data.pop("currentProject")
            db.update_user_details(user[0], update_data)
            return jsonify({"message": "Profil erfolgreich aktualisiert"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@auth_bp.route("/api/change-password", methods=["POST"])
@jwt_required()
def change_password():
    """Endpunkt zum Ändern des Benutzerpassworts."""
    current_user_email = get_jwt_identity()
    data = request.get_json()
    
    # Überprüfe erforderliche Felder
    if not all(field in data for field in ['currentPassword', 'newPassword', 'confirmPassword']):
        log_event('password_change_failed', user_id=current_user_email, 
                  details={'reason': 'missing_fields'})
        return jsonify({
            'success': False,
            'message': 'Alle Passwortfelder sind erforderlich'
        }), 400
    
    # Überprüfe, ob das neue Passwort mit der Bestätigung übereinstimmt
    if data['newPassword'] != data['confirmPassword']:
        log_event('password_change_failed', user_id=current_user_email, 
                  details={'reason': 'passwords_dont_match'})
        return jsonify({
            'success': False,
            'message': 'Das neue Passwort und die Bestätigung stimmen nicht überein'
        }), 400
    
    # Überprüfe Passwort-Komplexität
    if len(data['newPassword']) < 8:
        log_event('password_change_failed', user_id=current_user_email, 
                  details={'reason': 'password_too_short'})
        return jsonify({
            'success': False,
            'message': 'Das neue Passwort muss mindestens 8 Zeichen lang sein'
        }), 400
    
    try:
        db = Database()
        user = db.get_user_by_email(current_user_email)
        
        if not user:
            log_event('password_change_failed', user_id=current_user_email, 
                      details={'reason': 'user_not_found'})
            return jsonify({
                'success': False,
                'message': 'Benutzer nicht gefunden'
            }), 404
        
        # Überprüfe das aktuelle Passwort
        if not check_password_hash(user[7], data['currentPassword']):
            log_event('password_change_failed', user_id=current_user_email, 
                      details={'reason': 'incorrect_current_password'})
            return jsonify({
                'success': False,
                'message': 'Das aktuelle Passwort ist falsch'
            }), 401
        
        # Generiere neuen Passwort-Hash und aktualisiere in der Datenbank
        new_password_hash = generate_password_hash(data['newPassword'])
        
        # Wir verwenden die update_password-Methode, die Data Vault-konform ist
        db.update_password(user[0], new_password_hash)
        
        log_event('password_change_success', user_id=current_user_email)
        db.close()
        
        return jsonify({
            'success': True,
            'message': 'Passwort erfolgreich geändert'
        }), 200
        
    except Exception as e:
        print(f"Fehler bei der Passwortänderung: {e}")
        traceback.print_exc()
        log_event('password_change_failed', user_id=current_user_email, 
                  details={'reason': 'internal_error', 'error': str(e)})
        return jsonify({
            'success': False,
            'message': 'Ein interner Fehler ist aufgetreten'
        }), 500
