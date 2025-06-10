from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import Database
import uuid
import logging
from werkzeug.security import generate_password_hash

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
            WHERE h.user_id = %s AND s.t_to IS NULL AND h.t_to IS NULL
            ORDER BY s.t_from DESC
            LIMIT 1
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

@admin_bp.route('/api/admin/users', methods=['POST'])
@jwt_required()
def create_user():
    current_user = get_jwt_identity()
    if not is_admin(current_user):
        return jsonify({"error": "Keine Admin-Berechtigung"}), 403

    data = request.json
    db = Database()
    try:
        # Prüfe, ob E-Mail schon existiert
        exists = db.fetch_one("SELECT 1 FROM h_user WHERE user_id = %s AND t_to IS NULL", (data["email"],))
        if exists:
            return jsonify({"error": "E-Mail existiert bereits"}), 400

        # Neuen User anlegen
        hk_user = str(uuid.uuid4())
        db.execute(
            "INSERT INTO h_user (hk_user, user_id, t_from, rec_src) VALUES (%s, %s, NOW(), %s)",
            (hk_user, data["email"], "admin")
        )
        # User-Details anlegen
        db.execute(
            """INSERT INTO s_user_details 
            (hk_user, t_from, b_from, rec_src, first_name, last_name, position, core_hours, telefon, is_admin)
            VALUES (%s, NOW(), CURRENT_DATE, %s, %s, %s, %s, %s, %s, %s)""",
            (
                hk_user, "admin",
                data.get("firstName"), data.get("lastName"),
                data.get("position"), data.get("coreHours"),
                data.get("phone"), data.get("isAdmin", False)
            )
        )
        # Passwort setzen (optional, falls du s_user_login nutzt)
        if data.get("password"):
            pw_hash = generate_password_hash(data["password"])
            db.execute(
                """INSERT INTO s_user_login 
                (hk_user, t_from, b_from, rec_src, password_hash)
                VALUES (%s, NOW(), CURRENT_DATE, %s, %s)""",
                (hk_user, "admin", pw_hash)
            )
        db.commit()
        return jsonify({"message": "Benutzer erfolgreich angelegt"}), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@admin_bp.route('/api/admin/users/<user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    current_user = get_jwt_identity()
    if not is_admin(current_user):
        return jsonify({"error": "Keine Admin-Berechtigung"}), 403

    data = request.json
    db = Database()
    try:
        # Historisiere alten Eintrag
        db.execute(
            "UPDATE s_user_details SET t_to = NOW() WHERE hk_user = (SELECT hk_user FROM h_user WHERE user_id = %s AND t_to IS NULL) AND t_to IS NULL",
            (user_id,)
        )
        # Und auch hier:
        hk_users = db.fetch_all("SELECT hk_user FROM h_user WHERE user_id = %s AND t_to IS NULL", (user_id,))
        if not hk_users or len(hk_users) != 1:
            return jsonify({"error": "Inkonsistente Benutzerdaten: Mehrere oder kein aktiver Hub gefunden"}), 500
        hk_user = hk_users[0][0]
        # Neuen Eintrag anlegen
        db.execute(
            """INSERT INTO s_user_details 
            (hk_user, t_from, b_from, rec_src, first_name, last_name, position, core_hours, telefon, is_admin)
            VALUES (%s, NOW(), CURRENT_DATE, %s, %s, %s, %s, %s, %s, %s)""",
            (
                hk_user, "admin",
                data.get("firstName"), data.get("lastName"),
                data.get("position"), data.get("coreHours"),
                data.get("phone"), data.get("isAdmin", False)
            )
        )
        db.commit()
        return jsonify({"message": "Benutzer erfolgreich aktualisiert"})
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@admin_bp.route('/api/admin/users/<user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user = get_jwt_identity()
    if not is_admin(current_user):
        return jsonify({"error": "Keine Admin-Berechtigung"}), 403

    db = Database()
    try:
        hk_user = db.fetch_one("SELECT hk_user FROM h_user WHERE user_id = %s AND t_to IS NULL", (user_id,))
        if not hk_user:
            return jsonify({"error": "Benutzer nicht gefunden"}), 404
        hk_user = hk_user[0]
        # Historisiere alle offenen Satelliten
        db.execute("UPDATE s_user_details SET t_to = NOW() WHERE hk_user = %s AND t_to IS NULL", (hk_user,))
        db.execute("UPDATE s_user_login SET t_to = NOW() WHERE hk_user = %s AND t_to IS NULL", (hk_user,))
        # Historisiere auch den Hub-Eintrag!
        db.execute("UPDATE h_user SET t_to = NOW() WHERE hk_user = %s AND t_to IS NULL", (hk_user,))
        db.commit()
        return jsonify({"message": "Benutzer erfolgreich gelöscht"})
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()