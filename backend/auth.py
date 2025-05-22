"""
Authentifizierungsmodul für das Mitarbeiterportal.
Implementiert Benutzerregistrierung, Login und Passwort-Hashing.
"""

import json
import os
from werkzeug.security import generate_password_hash, check_password_hash
from flask import jsonify, request
from flask_jwt_extended import create_access_token
from log import log_event

# Pfad zur users.json
USERS_FILE = os.path.join(os.path.dirname(__file__), 'data', 'users.json')

def load_users():
    """
    Lädt die Benutzerdaten aus der JSON-Datei.
    Gibt ein Dictionary mit einer leeren Benutzerliste zurück, falls die Datei nicht existiert oder leer ist.
    """
    print(f"Versuche Benutzerdaten aus {USERS_FILE} zu laden...")
    if not os.path.exists(USERS_FILE):
        print(f"Datei {USERS_FILE} existiert nicht")
        return {"users": []}
    
    try:
        with open(USERS_FILE, 'r') as f:
            content = f.read()
            print(f"Gelesener Inhalt: {content}")
            if not content or content.strip() == "{}":
                print("Datei ist leer oder enthält nur {}")
                return {"users": []}
            parsed_data = json.loads(content)
            if not isinstance(parsed_data, dict) or 'users' not in parsed_data:
                print("Ungültiges Datenformat, initialisiere neu")
                return {"users": []}
            print(f"Geparste Daten: {parsed_data}")
            return parsed_data
    except (json.JSONDecodeError, FileNotFoundError) as e:
        print(f"Fehler beim Laden der Benutzerdaten: {e}")
        return {"users": []}

def save_users(users_data):
    """
    Speichert die Benutzerdaten in der JSON-Datei.
    Erstellt das Verzeichnis, falls es nicht existiert.
    """
    print(f"Versuche Benutzerdaten in {USERS_FILE} zu speichern...")
    try:
        data_dir = os.path.dirname(USERS_FILE)
        if not os.path.exists(data_dir):
            print(f"Erstelle Verzeichnis {data_dir}")
            os.makedirs(data_dir)
            
        print(f"Zu speichernde Daten: {users_data}")
        with open(USERS_FILE, 'w') as f:
            json.dump(users_data, f, indent=2)
        print("Benutzerdaten erfolgreich gespeichert")
    except IOError as e:
        print(f"Fehler beim Speichern der Benutzerdaten: {e}")
        raise

# Initialisiere die Benutzerdatei, falls sie nicht existiert oder leer/ungültig ist
if not os.path.exists(USERS_FILE) or not load_users().get('users'):
    print("Initialisiere users.json mit leerer Benutzerliste")
    save_users({"users": []})

def login_user():
    """
    Authentifiziert einen Benutzer und gibt einen JWT zurück.
    Überprüft E-Mail und Passwort gegen die gespeicherten Benutzerdaten.
    """
    print("Login-Versuch gestartet")
    data = request.get_json()
    print(f"Empfangene Daten: {data}")
    
    # Überprüfe, ob alle erforderlichen Felder vorhanden sind
    if not all(field in data for field in ['email', 'password']):
        print("Fehlende Felder im Login-Request")
        log_event('login_failed', details={'email': data.get('email'), 'reason': 'missing_fields'})
        return jsonify({
            'success': False,
            'message': 'E-Mail und Passwort sind erforderlich'
        }), 400
    
    # Lade Benutzer
    print("Lade Benutzerdaten...")
    users_data = load_users()
    print(f"Geladene Benutzerdaten: {users_data}")
    
    # Suche nach dem Benutzer
    user = next((user for user in users_data['users'] if user['email'] == data['email']), None)
    print(f"Gefundener Benutzer: {user}")
    
    if not user:
        print("Benutzer nicht gefunden")
        log_event('login_failed', details={'email': data['email'], 'reason': 'email_not_registered'})
        return jsonify({
            'success': False,
            'message': 'Diese E-Mail-Adresse ist nicht registriert. Bitte registrieren Sie sich zuerst.'
        }), 401
    
    # Überprüfe das Passwort
    print("Überprüfe Passwort...")
    if not check_password_hash(user['password'], data['password']):
        print("Falsches Passwort")
        log_event('login_failed', user_id=user['email'], details={'reason': 'incorrect_password'})
        return jsonify({
            'success': False,
            'message': 'Falscher Benutzername oder Passwort'
        }), 401
    
    print("Login erfolgreich, erstelle JWT...")
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
    """
    Registriert einen neuen Benutzer.
    Überprüft die Eingabedaten und speichert den neuen Benutzer in der users.json.
    """
    print("Registrierungs-Versuch gestartet")
    data = request.get_json()
    print(f"Empfangene Daten: {data}")
    
    # Überprüfe, ob alle erforderlichen Felder vorhanden sind
    required_fields = ['email', 'password', 'firstName', 'lastName']
    if not all(field in data for field in required_fields):
        print("Fehlende Felder im Registrierungs-Request")
        log_event('registration_failed', details={'reason': 'missing_fields', 'email': data.get('email')})
        return jsonify({
            'success': False,
            'message': 'Alle Felder sind erforderlich'
        }), 400
    
    # Lade bestehende Benutzer
    print("Lade bestehende Benutzerdaten...")
    users_data = load_users()
    print(f"Geladene Benutzerdaten: {users_data}")
    
    # Überprüfe, ob die E-Mail bereits existiert
    if any(user['email'] == data['email'] for user in users_data['users']):
        print("E-Mail bereits registriert")
        log_event('registration_failed', details={'email': data['email'], 'reason': 'email_already_registered'})
        return jsonify({
            'success': False,
            'message': 'Diese E-Mail-Adresse ist bereits registriert'
        }), 400
    
    # Erstelle neuen Benutzer
    print("Erstelle neuen Benutzer...")
    new_user = {
        'email': data['email'],
        'password': generate_password_hash(data['password']),
        'firstName': data['firstName'],
        'lastName': data['lastName']
    }
    
    try:
        # Füge den neuen Benutzer hinzu
        print("Füge neuen Benutzer zur Liste hinzu...")
        users_data['users'].append(new_user)
        
        # Speichere die aktualisierten Benutzerdaten
        print("Speichere aktualisierte Benutzerdaten...")
        save_users(users_data)
        
        # Protokolliere erfolgreiche Registrierung
        log_event('registration_success', user_id=new_user['email'])
        print("Registrierung erfolgreich abgeschlossen")
        
        return jsonify({
            'success': True,
            'message': 'Registrierung erfolgreich'
        }), 201
    except Exception as e:
        # Protokolliere die Ausnahme
        print(f"Fehler beim Hinzufügen/Speichern des neuen Benutzers: {e}")
        log_event('registration_failed', details={'reason': 'internal_error', 'email': new_user['email'], 'error': str(e)})
        return jsonify({
            'success': False,
            'message': 'Ein interner Fehler ist bei der Registrierung aufgetreten.'
        }), 500
