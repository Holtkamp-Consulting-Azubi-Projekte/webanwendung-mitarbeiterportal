"""
Authentifizierungsmodul für das Mitarbeiterportal.
Implementiert Benutzerregistrierung, Login und Passwort-Hashing.
"""

from werkzeug.security import generate_password_hash, check_password_hash
from flask import jsonify, request
from flask_jwt_extended import create_access_token
from log import log_event
from database import Database
from datetime import datetime
import hashlib

def generate_hash_key(value):
    """Generiert einen Hash-Key für Data Vault-Tabellen."""
    return hashlib.sha256(str(value).encode()).digest()

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
    
    try:
        db = Database()
        # Benutzer aus der Datenbank abrufen
        user = db.get_user_by_email(data['email'])
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
        if not check_password_hash(user[7], data['password']):  # password_hash ist das 8. Feld
            print("Falsches Passwort")
            log_event('login_failed', user_id=user[1], details={'reason': 'incorrect_password'})
            return jsonify({
                'success': False,
                'message': 'Falscher Benutzername oder Passwort'
            }), 401
        
        print("Login erfolgreich, erstelle JWT...")
        # Erstelle den JWT
        access_token = create_access_token(identity=user[1])  # user_id ist das 2. Feld
        
        # Protokolliere erfolgreichen Login
        log_event('login_success', user_id=user[1])
        
        db.close()
        return jsonify({
            'success': True,
            'message': 'Login erfolgreich',
            'access_token': access_token
        }), 200
        
    except Exception as e:
        print(f"Fehler beim Login: {e}")
        log_event('login_failed', details={'reason': 'internal_error', 'error': str(e)})
        return jsonify({
            'success': False,
            'message': 'Ein interner Fehler ist aufgetreten'
        }), 500

def register_user():
    """
    Registriert einen neuen Benutzer.
    Überprüft die Eingabedaten und speichert den neuen Benutzer in der Datenbank.
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
    
    try:
        db = Database()
        # Überprüfe, ob die E-Mail bereits existiert
        existing_user = db.get_user_by_email(data['email'])
        if existing_user:
            print("E-Mail bereits registriert")
            log_event('registration_failed', details={'email': data['email'], 'reason': 'email_already_registered'})
            return jsonify({
                'success': False,
                'message': 'Diese E-Mail-Adresse ist bereits registriert'
            }), 400
        
        # Erstelle neuen Benutzer
        print("Erstelle neuen Benutzer...")
        password_hash = generate_password_hash(data['password'])
        db.insert_user(
            data['email'],
            data['firstName'],
            data['lastName'],
            password_hash
        )
        
        # Protokolliere erfolgreiche Registrierung
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
            'message': 'Ein interner Fehler ist bei der Registrierung aufgetreten.'
        }), 500
