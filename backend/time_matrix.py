"""
Zeitmatrix-Modul für das Mitarbeiterportal.
Implementiert die Verwaltung von Zeiteinträgen und die Zeitmatrix-Funktionalität.
"""

from flask import Blueprint, request, jsonify
import os
import json
import time
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt_identity

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'zeitmatrix.json')

time_matrix_bp = Blueprint('time_matrix', __name__, url_prefix='/api/time-entries')

def validate_time_entry(entry, existing_entries=None):
    """
    Validiert einen Zeiteintrag auf:
    - Korrektes Datums- und Zeitformat
    - Chronologische Reihenfolge von Beginn und Ende
    """
    errors = []
    
    # Prüfe ob alle erforderlichen Felder vorhanden sind
    required_fields = ['datum', 'beginn', 'ende', 'projekt']
    for field in required_fields:
        if field not in entry or not entry[field]:
            errors.append(f"Feld '{field}' ist erforderlich")
    
    if errors:
        return False, errors
    
    try:
        # Konvertiere Datum und Zeiten in datetime-Objekte
        entry_date = datetime.strptime(entry['datum'], '%Y-%m-%d')
        start_time = datetime.strptime(entry['beginn'], '%H:%M')
        end_time = datetime.strptime(entry['ende'], '%H:%M')
        
        # Kombiniere Datum und Zeiten
        start_datetime = datetime.combine(entry_date.date(), start_time.time())
        end_datetime = datetime.combine(entry_date.date(), end_time.time())
        
        # Prüfe ob Ende nach Beginn liegt
        if end_datetime <= start_datetime:
            errors.append("Endzeit muss nach der Startzeit liegen")
        
    except ValueError as e:
        errors.append(f"Ungültiges Datums- oder Zeitformat: {str(e)}")
    
    return len(errors) == 0, errors

def load_entries():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
            if not isinstance(data, list):
                print("Warning: Data file does not contain a list. Returning empty list.") # Log für Debugging
                return []

            # IDs für Einträge ohne ID hinzufügen
            updated_data = False
            for entry in data:
                if 'id' not in entry or entry['id'] is None:
                    entry['id'] = str(int(time.time() * 1000))
                    updated_data = True
                    time.sleep(0.001) # Kurze Pause, um eindeutige Timestamps zu gewährleisten
                
                # Konvertiere einzelnes Projekt in Array, falls nötig
                if 'projekt' in entry and not isinstance(entry['projekt'], list):
                    entry['projekt'] = [entry['projekt']]
                    updated_data = True

            # Wenn neue IDs hinzugefügt wurden, Datei speichern
            if updated_data:
                save_entries(data)
                print("Info: Added missing IDs to entries in zeitmatrix.json") # Log für Debugging

            return data
        except (json.JSONDecodeError, FileNotFoundError) as e:
            print(f"Error loading data: {e}") # Log für Debugging
            return []

def save_entries(entries):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)

@time_matrix_bp.route('/', methods=['GET'])
def get_entries():
    logger.info("GET request received")
    entries = load_entries()
    return jsonify(entries)

@time_matrix_bp.route('/', methods=['POST'])
def add_entry():
    logger.info("POST request received")
    data = request.get_json()
    logger.info(f"POST data: {data}")
    if not data:
        logger.error("No data received in POST request")
        return jsonify({'error': 'Keine Daten erhalten'}), 400

    # Stelle sicher, dass projekt ein Array ist
    if 'projekt' in data and not isinstance(data['projekt'], list):
        data['projekt'] = [data['projekt']]

    entries = load_entries()
    
    # Validiere den neuen Eintrag
    is_valid, errors = validate_time_entry(data, entries)
    if not is_valid:
        logger.error(f"Validation errors in POST request: {errors}")
        return jsonify({'error': 'Validierungsfehler', 'details': errors}), 400

    # Eindeutige ID hinzufügen
    if 'id' not in data or data['id'] is None:
       data['id'] = str(int(time.time() * 1000))

    entries.append(data)
    save_entries(entries)
    logger.info(f"Entry added with ID: {data['id']}")
    return jsonify({'status': 'ok', 'message': 'Eintrag gespeichert', 'id': data['id']}), 201

@time_matrix_bp.route('/<entry_id>', methods=['PUT'])
def update_entry(entry_id):
    logger.info(f"PUT request received for ID: {entry_id}")
    data = request.get_json()
    logger.info(f"PUT data: {data}")
    if not data:
        logger.error(f"No data received in PUT request for ID: {entry_id}")
        return jsonify({'error': 'Keine Daten erhalten'}), 400

    # Stelle sicher, dass projekt ein Array ist
    if 'projekt' in data and not isinstance(data['projekt'], list):
        data['projekt'] = [data['projekt']]

    entries = load_entries()
    
    # Validiere den aktualisierten Eintrag
    is_valid, errors = validate_time_entry(data, entries)
    if not is_valid:
        logger.error(f"Validation errors in PUT request for ID {entry_id}: {errors}")
        return jsonify({'error': 'Validierungsfehler', 'details': errors}), 400

    for i, entry in enumerate(entries):
        if entry['id'] == entry_id:
            entries[i] = {**entry, **data}
            save_entries(entries)
            logger.info(f"Entry updated with ID: {entry_id}")
            return jsonify({'status': 'ok', 'message': 'Eintrag aktualisiert'})
    logger.warning(f"Entry not found for PUT request with ID: {entry_id}")
    return jsonify({'error': 'Eintrag nicht gefunden'}), 404

@time_matrix_bp.route('/<entry_id>', methods=['DELETE'])
def delete_entry(entry_id):
    logger.info(f"DELETE request received for ID: {entry_id}")
    entries = load_entries()
    for i, entry in enumerate(entries):
        if entry['id'] == entry_id:
            del entries[i]
            save_entries(entries)
            logger.info(f"Entry deleted with ID: {entry_id}")
            return jsonify({'status': 'ok', 'message': 'Eintrag gelöscht'})
    logger.warning(f"Entry not found for DELETE request with ID: {entry_id}")
    return jsonify({'error': 'Eintrag nicht gefunden'}), 404 