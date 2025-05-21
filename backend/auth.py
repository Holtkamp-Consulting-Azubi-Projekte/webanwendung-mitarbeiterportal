import json
import os
from werkzeug.security import generate_password_hash, check_password_hash
from flask import jsonify, request
from flask_jwt_extended import create_access_token
from log import log_event

# Pfad zur users.json
USERS_FILE = os.path.join(os.path.dirname(__file__), 'data', 'users.json')

def load_users():
    """Lädt die Benutzerdaten aus der JSON-Datei."""
    if not os.path.exists(USERS_FILE):
        return {"users": []}
    
    try:
        with open(USERS_FILE, 'r') as f:
            # Read content to handle empty file case specifically
            content = f.read()
            if not content:
                return {"users": []}
            return json.loads(content)
    except (json.JSONDecodeError, FileNotFoundError) as e:
        print(f"Fehler beim Laden der Benutzerdaten: {e}")
        return {"users": []}

def save_users(users_data):
    """Speichert die Benutzerdaten in der JSON-Datei."""
    try:
        # Ensure the data directory exists
        data_dir = os.path.dirname(USERS_FILE)
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)
            
        with open(USERS_FILE, 'w') as f:
            json.dump(users_data, f, indent=2)
    except IOError as e:
        print(f"Fehler beim Speichern der Benutzerdaten: {e}")

# Initialisiere die Benutzerdatei, falls sie nicht existiert oder leer/ungültig ist
if not os.path.exists(USERS_FILE) or not load_users().get('users'):
    save_users({"users": []})

def login_user():
    """Authentifiziert einen Benutzer und gibt einen JWT zurück."""
    data = request.get_json()
    
    # Überprüfe, ob alle erforderlichen Felder vorhanden sind
    if not all(field in data for field in ['email', 'password']):
        # Protokolliere fehlgeschlagenen Login (fehlende Felder)
        log_event('login_failed', details={'email': data.get('email'), 'reason': 'missing_fields'})
        return jsonify({
            'success': False,
            'message': 'E-Mail und Passwort sind erforderlich'
        }), 400
    
    # Lade Benutzer
    users_data = load_users()
    
    # Suche nach dem Benutzer
    user = next((user for user in users_data['users'] if user['email'] == data['email']), None)
    
    if not user:
        # Protokolliere fehlgeschlagenen Login (E-Mail nicht registriert)
        log_event('login_failed', details={'email': data['email'], 'reason': 'email_not_registered'})
        return jsonify({
            'success': False,
            'message': 'Diese E-Mail-Adresse ist nicht registriert. Bitte registrieren Sie sich zuerst.'
        }), 401
    
    # Überprüfe das Passwort
    if not check_password_hash(user['password'], data['password']):
        # Protokolliere fehlgeschlagenen Login (falsches Passwort)
        log_event('login_failed', user_id=user['email'], details={'reason': 'incorrect_password'})
        return jsonify({
            'success': False,
            'message': 'Falscher Benutzername oder Passwort'
        }), 401
    
    # Erstelle den JWT
    access_token = create_access_token(identity=user['email'])
    
    # Protokolliere erfolgreichen Login
    log_event('login_success', user_id=user['email'])

    
    return jsonify({
        'success': True,
        'message': 'Login erfolgreich',
        'access_token': access_token
    }), 200

def register_user():
    """Registriert einen neuen Benutzer."""
    data = request.get_json()
    
    # Überprüfe, ob alle erforderlichen Felder vorhanden sind
    required_fields = ['email', 'password', 'firstName', 'lastName']
    if not all(field in data for field in required_fields):
        # Protokolliere fehlgeschlagene Registrierung (fehlende Felder)
        log_event('registration_failed', details={'reason': 'missing_fields', 'email': data.get('email')})
        return jsonify({
            'success': False,
            'message': 'Alle Felder sind erforderlich'
        }), 400
    
    # Lade bestehende Benutzer
    users_data = load_users()
    
    # Überprüfe, ob die E-Mail bereits existiert
    if any(user['email'] == data['email'] for user in users_data['users']):
        # Protokolliere fehlgeschlagene Registrierung (E-Mail existiert bereits)
        log_event('registration_failed', details={'email': data['email'], 'reason': 'email_already_registered'})
        return jsonify({
            'success': False,
            'message': 'Diese E-Mail-Adresse ist bereits registriert'
        }), 400
    
    # Erstelle neuen Benutzer
    new_user = {
        'email': data['email'],
        'password': generate_password_hash(data['password']),
        'firstName': data['firstName'],
        'lastName': data['lastName']
    }
    
    # Füge den neuen Benutzer hinzu
    users_data['users'].append(new_user)
    
    # Speichere die aktualisierten Benutzerdaten
    save_users(users_data)
    
    # Protokolliere erfolgreiche Registrierung
    log_event('registration_success', user_id=new_user['email'])

    
    return jsonify({
        'success': True,
        'message': 'Registrierung erfolgreich'
    }), 201
