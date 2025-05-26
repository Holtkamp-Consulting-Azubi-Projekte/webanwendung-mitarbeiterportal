import json
import os
from datetime import datetime
from database import Database
import hashlib

def log_event(event_type, user_id=None, details=None):
    """Protokolliert ein Ereignis in der Datenbank.

    Args:
        event_type (str): Die Art des Ereignisses (z.B. 'login_success', 'login_failed').
        user_id (str, optional): Die user_id des Benutzers, falls relevant. Defaults to None.
        details (dict, optional): Zusätzliche Details zum Ereignis. Defaults to None.
    """
    db = Database()
    try:
        hk_user = None
        if user_id:
            # Hole den hk_user anhand der user_id (E-Mail)
            user = db.get_user_by_email(user_id)
            if user:
                hk_user = user[0] # hk_user ist das erste Feld im user-Tuple

        timestamp = datetime.utcnow()
        rec_src = 'API' # Oder eine passendere Quelle

        db.execute(
            """
            INSERT INTO APP_LOGS (timestamp, event_type, hk_user, details, rec_src)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (timestamp, event_type, hk_user, json.dumps(details) if details else None, rec_src)
        )
        db.commit()

    except Exception as e:
        db.rollback()
        # Hier sollte eine alternative Protokollierung stattfinden, falls die DB nicht verfügbar ist
        print(f"Fehler beim Protokollieren des Ereignisses in der Datenbank: {e}")
    finally:
        db.close() 