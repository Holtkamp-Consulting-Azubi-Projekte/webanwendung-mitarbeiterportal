from flask import Blueprint, request, jsonify
import os
import json
import time

DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'zeitmatrix.json')

time_matrix_bp = Blueprint('time_matrix', __name__, url_prefix='/api/time-entries')

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
    entries = load_entries()
    return jsonify(entries)

@time_matrix_bp.route('/', methods=['POST'])
def add_entry():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Keine Daten erhalten'}), 400

    entries = load_entries()
    # Eindeutige ID hinzufügen (falls noch nicht vorhanden, sollte aber durch load_entries abgedeckt sein)
    if 'id' not in data or data['id'] is None:
       data['id'] = str(int(time.time() * 1000))

    entries.append(data)
    save_entries(entries)
    return jsonify({'status': 'ok', 'message': 'Eintrag gespeichert', 'id': data['id']}), 201

@time_matrix_bp.route('/<string:entry_id>', methods=['PUT'])
def update_entry(entry_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Keine Daten erhalten'}), 400

    entries = load_entries()
    updated = False
    for i, entry in enumerate(entries):
        # Überprüfen, ob entry und entry.get('id') nicht None sind, bevor verglichen wird
        if entry and entry.get('id') == entry_id:
            # Eintrag aktualisieren (ID nicht ändern)
            entries[i] = {**data, 'id': entry_id}
            updated = True
            break

    if updated:
        save_entries(entries)
        return jsonify({'status': 'ok', 'message': f'Eintrag {entry_id} aktualisiert'})
    else:
        # Gebe 404 zurück, wenn Eintrag nicht gefunden
        return jsonify({'error': f'Eintrag {entry_id} nicht gefunden'}), 404

@time_matrix_bp.route('/<string:entry_id>', methods=['DELETE'])
def delete_entry(entry_id):
    entries = load_entries()
    original_count = len(entries)
    # Filtert den Eintrag mit der gegebenen ID heraus.
    # Sicherstellen, dass entry und entry.get('id') nicht None sind
    entries = [entry for entry in entries if entry and entry.get('id') != entry_id]

    if len(entries) < original_count:
        save_entries(entries)
        return jsonify({'status': 'ok', 'message': f'Eintrag {entry_id} gelöscht'})
    else:
        # Gebe 404 zurück, wenn Eintrag nicht gefunden (passiert, wenn kein Eintrag mit der ID gefunden wurde)
        return jsonify({'error': f'Eintrag {entry_id} nicht gefunden'}), 404 