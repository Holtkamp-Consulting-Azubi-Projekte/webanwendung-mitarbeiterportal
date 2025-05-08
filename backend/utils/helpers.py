import hashlib
import json

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def save_json(data, filepath):
    """Speichert die gegebenen Daten als JSON in die angegebene Datei."""
    try:
        with open(filepath, 'w') as file:
            json.dump(data, file, indent=4)
        return True
    except Exception as e:
        print(f"Fehler beim Speichern von JSON: {e}")
        return False