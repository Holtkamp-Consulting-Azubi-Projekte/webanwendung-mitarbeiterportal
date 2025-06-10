from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import Database
import uuid
import logging

admin_bp = Blueprint('admin', __name__)

# Logger konfigurieren
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def is_admin(user_id):
    """Prüft, ob der aktuelle Benutzer Admin ist."""
    db = Database()
    try:
        result = db.fetch_one(
            """
            SELECT s.is_admin
            FROM h_user h
            JOIN s_user_details s ON h.hk_user = s.hk_user
            WHERE h.user_id = %s AND s.t_to IS NULL
            """,
            (user_id,)
        )
        logger.info(f"Admin-Check für {user_id}: {result}")
        return result and result[0] is True
    except Exception as e:
        logger.error(f"Fehler beim Prüfen der Admin-Rechte: {e}")
        return False
    finally:
        db.close()

@admin_bp.route('/api/admin/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """Gibt alle Benutzer mit Details zurück (nur für Admins)."""
    current_user = get_jwt_identity()
    logger.info(f"Admin-API aufgerufen von: {current_user}")
    
    if not is_admin(current_user):
        logger.warning(f"Unberechtigter Zugriff auf Admin-API von: {current_user}")
        return jsonify({"error": "Keine Admin-Berechtigung"}), 403

    db = Database()
    try:
        logger.info("Benutzer werden aus der Datenbank abgerufen...")
        users = db.fetch_all("""
            SELECT 
                h.user_id,
                h.hk_user,
                s.first_name, 
                s.last_name, 
                s.position,
                s.telefon,
                s.core_hours,
                s.is_admin
            FROM 
                h_user h
            JOIN 
                s_user_details s ON h.hk_user = s.hk_user
            WHERE 
                s.t_to IS NULL
            ORDER BY 
                s.last_name, s.first_name
        """)
        
        logger.info(f"Rohdaten aus DB: {users}")
        result = []
        for user in users:
            logger.info(f"User-Datensatz: {user}")
            core_hours = user[6]
            result.append({
                "id": user[0],
                "hk_user": str(user[1]),
                "firstName": user[2],
                "lastName": user[3],
                "position": user[4],
                "phone": user[5],
                "coreHours": core_hours if core_hours else None,
                "isAdmin": bool(user[7])
            })
        
        logger.info(f"{len(result)} Benutzer gefunden.")
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der Benutzer: {e}")
        return jsonify({"error": f"Serverfehler: {e}"}), 500
    finally:
        db.close()