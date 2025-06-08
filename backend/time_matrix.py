"""
Zeitmatrix-Modul für das Mitarbeiterportal.
Implementiert die Verwaltung von Zeiteinträgen und die Zeitmatrix-Funktionalität über die Datenbank.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import logging
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import Database
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

time_matrix_bp = Blueprint('time_matrix', __name__)

def validate_time_entry(entry):
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
        entry_date_str = entry['datum']
        start_time_str = entry['beginn']
        end_time_str = entry['ende']

        try:
            entry_date = datetime.strptime(entry_date_str, '%Y-%m-%d')
        except ValueError:
            errors.append("Ungültiges Datumsformat. Erwartet YYYY-MM-DD.")

        try:
            start_time_obj = datetime.strptime(start_time_str, '%H:%M').time()
        except ValueError:
            errors.append("Ungültiges Format für Beginnzeit. Erwartet HH:MM.")

        end_time_obj = None
        if end_time_str:
            try:
                end_time_obj = datetime.strptime(end_time_str, '%H:%M').time()
                
                # Prüfe ob Endzeit nach Beginnzeit liegt
                if start_time_obj >= end_time_obj:
                    errors.append("Endzeit muss nach Beginnzeit liegen.")
            except ValueError:
                errors.append("Ungültiges Format für Endzeit. Erwartet HH:MM.")

    except Exception as e:
        errors.append(f"Validierungsfehler: {str(e)}")
        logger.error(f"Fehler bei der Validierung: {str(e)}")

    return len(errors) == 0, errors

@time_matrix_bp.route("/api/time-entries", methods=["GET"])
@jwt_required()
def get_entries():
    """
    API-Endpunkt zum Abrufen aller Zeiteinträge des angemeldeten Benutzers.
    Optional filterbar nach Jahr und Monat.
    """
    current_user = get_jwt_identity()
    logger.info(f"Versuche Zeiteinträge für Benutzer {current_user} zu laden")
    
    # Optional: Filter nach Jahr/Monat
    year = request.args.get('year')
    month = request.args.get('month')
    
    db = Database()
    try:
        # Benutzer-ID aus Email abrufen
        user_result = db.fetch_one("SELECT hk_user FROM h_user WHERE email = %s", (current_user,))
        if not user_result:
            logger.error(f"Benutzer mit Email {current_user} nicht gefunden")
            return jsonify({"error": "Benutzer nicht gefunden"}), 404
            
        user_id = user_result[0]
        logger.info(f"Gefundene Benutzer-ID: {user_id}")
        
        # Abfrage der Zeiteinträge mit JOIN über die vorhandenen Tabellen
        query = """
            SELECT 
                l.timeentry_id as id, 
                s.entry_date as datum, 
                s.start_time as beginn, 
                s.end_time as ende, 
                s.pause_minutes as pause, 
                p.project_name as projekt, 
                s.work_location as arbeitsort, 
                s.description as beschreibung,
                CONCAT(u.first_name, ' ', u.last_name) as mitarbeiter
            FROM 
                l_user_project_timeentry l
                JOIN s_timeentry_details s ON l.timeentry_id = s.timeentry_id
                JOIN h_user u ON l.hk_user = u.hk_user
                JOIN h_project p ON l.hk_project = p.hk_project
            WHERE 
                l.hk_user = %s
        """
        params = [user_id]
        
        # Filter anwenden, falls vorhanden
        if year and month:
            query += " AND EXTRACT(YEAR FROM s.entry_date) = %s AND EXTRACT(MONTH FROM s.entry_date) = %s"
            params.extend([year, month])
        
        # Sortierung hinzufügen
        query += " ORDER BY s.entry_date DESC, s.start_time"
        
        # Query ausführen und Ergebnisse verarbeiten
        logger.info(f"Führe Abfrage aus: {query} mit Parametern {params}")
        
        try:
            entries = db.fetch_all(query, tuple(params))
            
            result = []
            for entry in entries:
                result.append({
                    "id": entry[0],
                    "datum": entry[1].strftime('%Y-%m-%d') if entry[1] else None,
                    "beginn": entry[2].strftime('%H:%M') if entry[2] else None,
                    "ende": entry[3].strftime('%H:%M') if entry[3] else None,
                    "pause": entry[4],
                    "projekt": entry[5],
                    "arbeitsort": entry[6],
                    "beschreibung": entry[7],
                    "mitarbeiter": entry[8]
                })
                
            logger.info(f"Gefundene Zeiteinträge: {len(result)}")
            return jsonify(result)
            
        except Exception as e:
            logger.error(f"Fehler bei der Datenbankabfrage: {str(e)}")
            return jsonify([])
        
    except Exception as e:
        logger.error(f"Allgemeiner Fehler beim Abrufen der Zeiteinträge: {str(e)}")
        return jsonify([])
    finally:
        db.close()

# Hilfsfunktion zum Generieren einer neuen UUID
def generate_uuid():
    return uuid.uuid4()

@time_matrix_bp.route("/api/time-entries", methods=["POST"])
@jwt_required()
def add_entry():
    """
    API-Endpunkt zum Hinzufügen eines neuen Zeiteintrags.
    Verwendet die Tabellen s_timeentry_details und l_user_project_timeentry
    """
    current_user = get_jwt_identity()
    data = request.get_json()
    
    logger.info(f"Empfangene Daten für neuen Zeiteintrag: {data}")
    
    if not data:
        return jsonify({"error": "Keine Daten erhalten"}), 400
        
    # Validierung der Eingabedaten
    is_valid, errors = validate_time_entry(data)
    if not is_valid:
        logger.error(f"Validierungsfehler: {errors}")
        return jsonify({
            "error": "Validierungsfehler",
            "details": errors
        }), 400
    
    db = Database()
    try:
        # Benutzer-ID aus Email abrufen
        user_result = db.fetch_one("SELECT hk_user FROM h_user WHERE email = %s", (current_user,))
        if not user_result:
            logger.error(f"Benutzer mit Email {current_user} nicht gefunden")
            return jsonify({"error": "Benutzer nicht gefunden"}), 404
            
        user_id = user_result[0]
        logger.info(f"Benutzer-ID für Zeiteintrag: {user_id}")
        
        # Projekt-ID abrufen (nehmen wir das erste Projekt aus der Liste)
        if isinstance(data['projekt'], list):
            projekt = data['projekt'][0]  # Erstes Projekt nehmen, wenn mehrere übergeben wurden
        else:
            projekt = data['projekt']
            
        # Prüfe ob das Projekt existiert
        project_query = "SELECT hk_project FROM h_project WHERE project_name = %s"
        project_result = db.fetch_one(project_query, (projekt,))
        
        if not project_result:
            # Falls das Projekt nicht existiert, versuchen wir das erste verfügbare Projekt zu nehmen
            fallback_project = db.fetch_one("SELECT hk_project FROM h_project LIMIT 1")
            if not fallback_project:
                return jsonify({"error": "Kein gültiges Projekt gefunden"}), 400
            project_id = fallback_project[0]
            logger.warning(f"Projekt '{projekt}' nicht gefunden. Verwende Fallback-Projekt-ID: {project_id}")
        else:
            project_id = project_result[0]
            logger.info(f"Projekt-ID gefunden: {project_id}")
        
        # 1. Zuerst den Zeiteintrag in s_timeentry_details einfügen
        timeentry_id = generate_uuid()
        details_query = """
            INSERT INTO s_timeentry_details 
            (timeentry_id, entry_date, start_time, end_time, pause_minutes, work_location, description) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        db.execute(details_query, (
            timeentry_id,
            data['datum'],
            data['beginn'],
            data['ende'],
            data.get('pause', 0),
            data.get('arbeitsort', 'Büro'),
            data.get('beschreibung', '')
        ))
        
        # 2. Dann die Verknüpfung in l_user_project_timeentry einfügen
        link_query = """
            INSERT INTO l_user_project_timeentry 
            (hk_user, hk_project, timeentry_id) 
            VALUES (%s, %s, %s)
        """
        
        db.execute(link_query, (
            user_id,
            project_id,
            timeentry_id
        ))
        
        db.commit()
        
        return jsonify({
            "success": True,
            "message": "Zeiteintrag erfolgreich erstellt",
            "id": str(timeentry_id)
        })
        
    except Exception as e:
        db.rollback()
        logger.error(f"Fehler beim Erstellen des Zeiteintrags: {str(e)}")
        return jsonify({"error": f"Serverfehler: {str(e)}"}), 500
    finally:
        db.close()

@time_matrix_bp.route("/api/time-entries/<uuid:entry_id>", methods=["PUT"])
@jwt_required()
def update_entry(entry_id):
    """
    API-Endpunkt zum Aktualisieren eines Zeiteintrags.
    """
    current_user = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Keine Daten erhalten"}), 400
        
    # Validierung der Eingabedaten
    is_valid, errors = validate_time_entry(data)
    if not is_valid:
        return jsonify({
            "error": "Validierungsfehler",
            "details": errors
        }), 400
    
    db = Database()
    try:
        # Benutzer-ID aus Email abrufen
        user_result = db.fetch_one("SELECT hk_user FROM h_user WHERE email = %s", (current_user,))
        if not user_result:
            return jsonify({"error": "Benutzer nicht gefunden"}), 404
            
        user_id = user_result[0]
        
        # Zuerst prüfen, ob der Eintrag dem angeforderten Benutzer gehört
        ownership_check = db.fetch_one(
            "SELECT timeentry_id FROM l_user_project_timeentry WHERE timeentry_id = %s AND hk_user = %s",
            (entry_id, user_id)
        )
        
        if not ownership_check:
            return jsonify({
                "error": "Zugriff verweigert oder Eintrag nicht gefunden"
            }), 403
        
        # Projekt aktualisieren, falls nötig
        if 'projekt' in data:
            projekt = data['projekt']
            if isinstance(projekt, list) and len(projekt) > 0:
                projekt = projekt[0]  # Erstes Projekt nehmen
            
            # Projekt-ID finden
            project_result = db.fetch_one("SELECT hk_project FROM h_project WHERE project_name = %s", (projekt,))
            
            if project_result:
                project_id = project_result[0]
                
                # Projekt in der Verknüpfungstabelle aktualisieren
                db.execute(
                    "UPDATE l_user_project_timeentry SET hk_project = %s WHERE timeentry_id = %s AND hk_user = %s",
                    (project_id, entry_id, user_id)
                )
        
        # Eintrag aktualisieren in s_timeentry_details
        db.execute(
            """
            UPDATE s_timeentry_details
            SET entry_date = %s, start_time = %s, end_time = %s, 
                pause_minutes = %s, work_location = %s, description = %s
            WHERE timeentry_id = %s
            """,
            (
                data['datum'],
                data['beginn'],
                data['ende'],
                data.get('pause', 0),
                data.get('arbeitsort', 'Büro'),
                data.get('beschreibung', ''),
                entry_id
            )
        )
        
        db.commit()
        
        return jsonify({
            "success": True,
            "message": "Zeiteintrag erfolgreich aktualisiert"
        })
        
    except Exception as e:
        db.rollback()
        logger.error(f"Fehler beim Aktualisieren des Zeiteintrags: {str(e)}")
        return jsonify({"error": f"Serverfehler: {str(e)}"}), 500
    finally:
        db.close()

@time_matrix_bp.route("/api/time-entries/<uuid:entry_id>", methods=["DELETE"])
@jwt_required()
def delete_entry(entry_id):
    """
    API-Endpunkt zum Löschen eines Zeiteintrags.
    """
    current_user = get_jwt_identity()
    
    db = Database()
    try:
        # Benutzer-ID aus Email abrufen
        user_result = db.fetch_one("SELECT hk_user FROM h_user WHERE email = %s", (current_user,))
        if not user_result:
            return jsonify({"error": "Benutzer nicht gefunden"}), 404
            
        user_id = user_result[0]
        
        # Zuerst prüfen, ob der Eintrag dem angeforderten Benutzer gehört
        ownership_check = db.fetch_one(
            "SELECT timeentry_id FROM l_user_project_timeentry WHERE timeentry_id = %s AND hk_user = %s",
            (entry_id, user_id)
        )
        
        if not ownership_check:
            return jsonify({
                "error": "Zugriff verweigert oder Eintrag nicht gefunden"
            }), 403
        
        # Zuerst die Verknüpfung löschen
        db.execute(
            "DELETE FROM l_user_project_timeentry WHERE timeentry_id = %s",
            (entry_id,)
        )
        
        # Dann den eigentlichen Eintrag löschen
        db.execute(
            "DELETE FROM s_timeentry_details WHERE timeentry_id = %s",
            (entry_id,)
        )
        
        db.commit()
        
        return jsonify({
            "success": True,
            "message": "Zeiteintrag erfolgreich gelöscht"
        })
        
    except Exception as e:
        db.rollback()
        logger.error(f"Fehler beim Löschen des Zeiteintrags: {str(e)}")
        return jsonify({"error": f"Serverfehler: {str(e)}"}), 500
    finally:
        db.close()

# Endpunkt zum Abrufen der verfügbaren Projekte
@time_matrix_bp.route("/api/projects", methods=["GET"])
@jwt_required()
def get_projects():
    """
    API-Endpunkt zum Abrufen aller verfügbaren Projekte für den Benutzer.
    """
    db = Database()
    try:
        # Alle Projekte abrufen
        projects = db.fetch_all("""
            SELECT hk_project, project_name, customer_id
            FROM h_project
            ORDER BY project_name
        """)
        
        # IDs der Kunden abrufen
        customer_ids = [p[2] for p in projects if p[2] is not None]
        customer_map = {}
        
        if customer_ids:
            customers = db.fetch_all(
                "SELECT hk_customer, customer_name FROM h_customer WHERE hk_customer IN %s",
                (tuple(customer_ids),)
            )
            customer_map = {c[0]: c[1] for c in customers}
        
        # Ergebnis formatieren
        result = []
        for project in projects:
            project_data = {
                "id": str(project[0]),
                "name": project[1]
            }
            
            if project[2] and project[2] in customer_map:
                project_data["customer"] = customer_map[project[2]]
            
            result.append(project_data)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der Projekte: {str(e)}")
        return jsonify([]), 500
    finally:
        db.close()