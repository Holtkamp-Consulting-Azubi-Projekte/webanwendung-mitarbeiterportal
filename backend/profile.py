from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from log import log_event
from database import Database
import traceback

profile_bp = Blueprint("profile", __name__)

@profile_bp.route("/api/profile", methods=["GET", "PUT", "OPTIONS"])
@jwt_required()
def profile():
    """Endpunkt zum Abrufen und Aktualisieren des Benutzerprofils."""
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
                    'currentProject': user[8]
                }
                log_event('profile_accessed', user_id=current_user_email)
                return jsonify(user_data), 200
            
            log_event('profile_access_failed', user_id=current_user_email, 
                     details={'reason': 'user_not_found'})
            return jsonify({"error": "Benutzer nicht gefunden"}), 404
        
        elif request.method == "PUT":
            user = db.get_user_by_email(current_user_email)
            if not user:
                log_event('profile_update_failed', user_id=current_user_email, 
                         details={'reason': 'user_not_found'})
                return jsonify({"error": "Benutzer nicht gefunden"}), 404
            
            update_data = request.json
            if "currentProject" in update_data:
                update_data["current_project"] = update_data.pop("currentProject")
            
            db.update_user_details(user[0], update_data)
            log_event('profile_updated', user_id=current_user_email)
            return jsonify({"message": "Profil erfolgreich aktualisiert"}), 200
    
    except Exception as e:
        print(f"Fehler beim Zugriff auf das Profil: {e}")
        traceback.print_exc()
        log_event('profile_error', user_id=current_user_email, details={'error': str(e)})
        return jsonify({"error": str(e)}), 500
    
    finally:
        db.close()

@profile_bp.route("/api/change-password", methods=["POST"])
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