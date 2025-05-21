import json
import os
from werkzeug.security import generate_password_hash, check_password_hash
from flask import jsonify, request

# Pfad zur users.json
USERS_FILE = os.path.join(os.path.dirname(__file__), 'data', 'users.json')

def load_users():
    """Lädt die Benutzerdaten aus der JSON-Datei."""
    if not os.path.exists(USERS_FILE):
        return {"users": []}
    
    with open(USERS_FILE, 'r') as f:
        return json.load(f)

def save_users(users_data):
    """Speichert die Benutzerdaten in der JSON-Datei."""
    with open(USERS_FILE, 'w') as f:
        json.dump(users_data, f, indent=2)

def login_user():
    """Authentifiziert einen Benutzer."""
    data = request.get_json()
    
    # Überprüfe, ob alle erforderlichen Felder vorhanden sind
    if not all(field in data for field in ['email', 'password']):
        return jsonify({
            'success': False,
            'message': 'E-Mail und Passwort sind erforderlich'
        }), 400
    
    # Lade Benutzer
    users_data = load_users()
    
    # Suche nach dem Benutzer
    user = next((user for user in users_data['users'] if user['email'] == data['email']), None)
    
    if not user:
        return jsonify({
            'success': False,
            'message': 'Diese E-Mail-Adresse ist nicht registriert. Bitte registrieren Sie sich zuerst.'
        }), 401
    
    # Überprüfe das Passwort
    if not check_password_hash(user['password'], data['password']):
        return jsonify({
            'success': False,
            'message': 'Falscher Benutzername oder Passwort'
        }), 401
    
    return jsonify({
        'success': True,
        'message': 'Login erfolgreich',
        'user': {
            'email': user['email'],
            'firstName': user['firstName'],
            'lastName': user['lastName']
        }
    }), 200

def register_user():
    """Registriert einen neuen Benutzer."""
    data = request.get_json()
    
    # Überprüfe, ob alle erforderlichen Felder vorhanden sind
    required_fields = ['email', 'password', 'firstName', 'lastName']
    if not all(field in data for field in required_fields):
        return jsonify({
            'success': False,
            'message': 'Alle Felder sind erforderlich'
        }), 400
    
    # Lade bestehende Benutzer
    users_data = load_users()
    
    # Überprüfe, ob die E-Mail bereits existiert
    if any(user['email'] == data['email'] for user in users_data['users']):
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
    
    return jsonify({
        'success': True,
        'message': 'Registrierung erfolgreich'
    }), 201
