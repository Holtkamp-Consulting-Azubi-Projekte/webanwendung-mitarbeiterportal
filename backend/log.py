import json
import os
from datetime import datetime

LOG_FILE = os.path.join(os.path.dirname(__file__), 'data', 'logs.json')

def load_logs():
    """Lädt Logs aus der JSON-Datei."""
    if not os.path.exists(LOG_FILE):
        return []
    try:
        with open(LOG_FILE, 'r') as f:
            content = f.read()
            if not content:
                return []
            # Use json.loads to parse the content that was read
            return json.loads(content)
    except (json.JSONDecodeError, FileNotFoundError) as e:
        print(f"Fehler beim Laden der Logs: {e}")
        return []

def save_logs(logs):
    """Speichert Logs in der JSON-Datei."""
    try:
        # Ensure the data directory exists
        data_dir = os.path.dirname(LOG_FILE)
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)

        # Open in write mode ('w') to overwrite with the full list
        with open(LOG_FILE, 'w') as f:
            json.dump(logs, f, indent=4)
    except IOError as e:
        print(f"Fehler beim Speichern der Logs: {e}")

def log_event(event_type, user_id=None, details=None):
    """Protokolliert ein Ereignis.

    Args:
        event_type (str): Die Art des Ereignisses (z.B. 'login_success', 'login_failed').
        user_id (int, optional): Die ID des Benutzers, falls relevant. Defaults to None.
        details (dict, optional): Zusätzliche Details zum Ereignis. Defaults to None.
    """
    logs = load_logs()
    timestamp = datetime.now().isoformat()
    log_entry = {
        'timestamp': timestamp,
        'event_type': event_type,
        'user_id': user_id,
        'details': details
    }
    logs.append(log_entry)
    save_logs(logs)

# Initialisiere die Log-Datei, falls sie nicht existiert
if not os.path.exists(LOG_FILE):
    save_logs([]) 