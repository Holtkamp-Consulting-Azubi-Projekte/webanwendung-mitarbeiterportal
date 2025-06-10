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
    Angepasst für das Data-Vault-Schema.
    """
    current_user = get_jwt_identity()
    logger.info(f"Versuche Zeiteinträge für Benutzer {current_user} zu laden")
    
    # Optional: Filter nach Jahr/Monat
    year = request.args.get('year')
    month = request.args.get('month')
    
    db = Database()
    try:
        # Benutzer-ID aus user_id (Email) abrufen
        user_result = db.fetch_one("SELECT hk_user FROM h_user WHERE user_id = %s", (current_user,))
        if not user_result:
            logger.error(f"Benutzer mit user_id {current_user} nicht gefunden")
            return jsonify({"error": "Benutzer nicht gefunden"}), 404
            
        user_id = user_result[0]
        logger.info(f"Gefundene Benutzer-ID (hk_user): {user_id}")
        
        # Abfrage für die neuesten Zeiteinträge je nach Data-Vault-Schema
        query = """
            WITH latest_entries AS (
                SELECT 
                    l.timeentry_id, 
                    l.hk_user_project_timeentry,
                    l.hk_project,
                    ROW_NUMBER() OVER (
                        PARTITION BY l.hk_user_project_timeentry 
                        ORDER BY s.t_from DESC
                    ) as rn
                FROM 
                    l_user_project_timeentry l
                JOIN 
                    s_timeentry_details s ON l.hk_user_project_timeentry = s.hk_user_project_timeentry
                WHERE 
                    l.hk_user = %s
                    AND (s.t_to IS NULL OR s.t_to > NOW())
            )
            SELECT 
                le.timeentry_id as id, 
                s.entry_date as datum, 
                s.start_time as beginn, 
                s.end_time as ende, 
                s.pause_minutes as pause, 
                hp.project_name as projekt, 
                s.work_location as arbeitsort, 
                s.description as beschreibung,
                CONCAT(ud.first_name, ' ', ud.last_name) as mitarbeiter
            FROM 
                latest_entries le
            JOIN 
                s_timeentry_details s ON le.hk_user_project_timeentry = s.hk_user_project_timeentry
            JOIN 
                h_project hp ON le.hk_project = hp.hk_project
            JOIN 
                h_user hu ON hu.hk_user = %s
            LEFT JOIN (
                SELECT 
                    hk_user, first_name, last_name,
                    ROW_NUMBER() OVER (
                        PARTITION BY hk_user 
                        ORDER BY t_from DESC
                    ) as rn
                FROM 
                    s_user_details
                WHERE 
                    t_to IS NULL OR t_to > NOW()
            ) ud ON ud.hk_user = hu.hk_user AND ud.rn = 1
            WHERE 
                le.rn = 1
        """
        params = [user_id, user_id]
        
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
            
            # Duplikatprüfung und -entfernung
            seen_ids = set()
            result = []
            for entry in entries:
                entry_id = entry[0]  # Der erste Wert ist die ID
                if entry_id not in seen_ids:
                    seen_ids.add(entry_id)
                    result.append({
                        "id": entry_id,
                        "datum": entry[1].strftime('%Y-%m-%d') if entry[1] else None,
                        "beginn": entry[2].strftime('%H:%M') if entry[2] else None,
                        "ende": entry[3].strftime('%H:%M') if entry[3] else None,
                        "pause": entry[4],
                        "projekt": entry[5],
                        "arbeitsort": entry[6],
                        "beschreibung": entry[7],
                        "mitarbeiter": entry[8]
                    })
                
            logger.info(f"Gefundene eindeutige Zeiteinträge: {len(result)}")
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
    Angepasst für das Data-Vault-Schema.
    """
    current_user = get_jwt_identity()
    data = request.get_json()
    
    logger.info(f"Empfangene Daten für neuen Zeiteintrag: {data}")
    logger.info(f"JWT Identity (current_user): {current_user}")
    
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
        # Benutzer-ID aus user_id abrufen (Email)
        user_result = db.fetch_one("SELECT hk_user FROM h_user WHERE user_id = %s", (current_user,))
        if not user_result:
            logger.error(f"Benutzer mit user_id {current_user} nicht gefunden")
            return jsonify({"error": "Benutzer nicht gefunden"}), 404
            
        user_id = user_result[0]
        logger.info(f"Gefundene Benutzer-ID (hk_user): {user_id}")
        
        # Projekt-ID abrufen (nehmen wir das erste Projekt aus der Liste)
        if isinstance(data['projekt'], list) and len(data['projekt']) > 0:
            projekt = data['projekt'][0]  # Erstes Projekt nehmen, wenn mehrere übergeben wurden
        else:
            projekt = data['projekt']
            
        # Prüfe ob das Projekt existiert
        project_query = "SELECT hk_project FROM h_project WHERE project_name = %s"
        project_result = db.fetch_one(project_query, (projekt,))
        
        if not project_result:
            logger.error(f"Projekt '{projekt}' nicht gefunden")
            return jsonify({"error": f"Projekt '{projekt}' nicht gefunden"}), 400
            
        project_id = project_result[0]
        logger.info(f"Gefundene Projekt-ID (hk_project): {project_id}")
        
        # 1. Eintrag in l_user_project_timeentry erstellen
        import uuid
        
        link_id = uuid.uuid4()  # Neue UUID für den Link generieren
        timeentry_id = str(uuid.uuid4())  # Neue UUID für den Zeiteintrag
        
        link_query = """
            INSERT INTO l_user_project_timeentry 
            (hk_user_project_timeentry, hk_user, hk_project, timeentry_id, rec_src) 
            VALUES (%s, %s, %s, %s, %s)
        """
        
        logger.info(f"Eintrag in l_user_project_timeentry: link_id={link_id}, user_id={user_id}, project_id={project_id}, timeentry_id={timeentry_id}")
        
        # Wichtige Änderung: UUIDs als Strings übergeben
        db.execute(link_query, (
            str(link_id),  # UUID als String umwandeln
            str(user_id),  # UUID als String umwandeln
            str(project_id),  # UUID als String umwandeln
            timeentry_id,  # Bereits ein String
            'web_app'  # Quelle des Datensatzes
        ))
        
        # 2. Zeiteintragsdetails in s_timeentry_details einfügen
        entry_date = data['datum']
        start_time = data['beginn']
        end_time = data['ende']
        pause_minutes = int(data.get('pause', 0))
        work_location = data.get('arbeitsort', 'Büro')
        description = data.get('beschreibung', '')
        
        details_query = """
            INSERT INTO s_timeentry_details 
            (hk_user_project_timeentry, t_from, rec_src, entry_date, start_time, end_time, 
             pause_minutes, work_location, description) 
            VALUES (%s, CURRENT_TIMESTAMP, %s, %s, %s, %s, %s, %s, %s)
        """
        
        logger.info(f"Eintrag in s_timeentry_details: link_id={link_id}, date={entry_date}, time={start_time}-{end_time}")
        
        # Auch hier UUID als String übergeben
        db.execute(details_query, (
            str(link_id),  # UUID als String umwandeln
            'web_app',  # Quelle des Datensatzes
            entry_date,
            start_time,
            end_time,
            pause_minutes,
            work_location,
            description
        ))
        
        db.commit()
        logger.info(f"Zeiteintrag erfolgreich erstellt mit timeentry_id: {timeentry_id}")
        
        return jsonify({
            "success": True,
            "message": "Zeiteintrag erfolgreich erstellt",
            "id": timeentry_id
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
    Angepasst für das Data-Vault-Schema.
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
        # Benutzer-ID aus user_id (Email) abrufen
        user_result = db.fetch_one("SELECT hk_user FROM h_user WHERE user_id = %s", (current_user,))
        if not user_result:
            return jsonify({"error": "Benutzer nicht gefunden"}), 404
            
        user_id = str(user_result[0])  # UUID als String umwandeln
        
        # Zuerst Link-ID ermitteln
        link_result = db.fetch_one("""
            SELECT hk_user_project_timeentry, hk_project
            FROM l_user_project_timeentry 
            WHERE timeentry_id = %s AND hk_user = %s
        """, (str(entry_id), user_id))
        
        if not link_result:
            return jsonify({"error": "Zeiteintrag nicht gefunden oder keine Berechtigung"}), 404
            
        link_id = str(link_result[0])  # UUID als String umwandeln
        current_project_id = str(link_result[1])  # UUID als String umwandeln
        
        # Rest des Codes analog anpassen mit String-Konvertierung für alle UUIDs
        # Prüfen ob das Projekt geändert wurde
        if isinstance(data['projekt'], list) and len(data['projekt']) > 0:
            projekt = data['projekt'][0]
        else:
            projekt = data['projekt']
            
        project_query = "SELECT hk_project FROM h_project WHERE project_name = %s"
        project_result = db.fetch_one(project_query, (projekt,))
        
        if not project_result:
            return jsonify({"error": f"Projekt '{projekt}' nicht gefunden"}), 400
            
        new_project_id = project_result[0]
        
        # Im Data Vault erzeugen wir einen neuen Eintrag anstatt zu aktualisieren
        
        # 1. Schließen des aktuellen Zeiteintrags
        db.execute("""
            UPDATE s_timeentry_details 
            SET t_to = CURRENT_TIMESTAMP 
            WHERE hk_user_project_timeentry = %s AND t_to IS NULL
        """, (link_id,))
        
        # 2. Einfügen eines neuen Zeiteintrags
        details_query = """
            INSERT INTO s_timeentry_details 
            (hk_user_project_timeentry, t_from, rec_src, entry_date, start_time, end_time, 
             pause_minutes, work_location, description) 
            VALUES (%s, CURRENT_TIMESTAMP, %s, %s, %s, %s, %s, %s, %s)
        """
        
        db.execute(details_query, (
            link_id,
            'web_app',
            data['datum'],
            data['beginn'],
            data['ende'],
            int(data.get('pause', 0)),
            data.get('arbeitsort', 'Büro'),
            data.get('beschreibung', '')
        ))
        
        # 3. Wenn das Projekt geändert wurde, aktualisieren wir auch den Link
        if new_project_id != current_project_id:
            # Schließen des alten Links
            db.execute("""
                UPDATE l_user_project_timeentry 
                SET t_to = CURRENT_TIMESTAMP 
                WHERE hk_user_project_timeentry = %s
            """, (link_id,))
            
            # Erstellen eines neuen Links mit neuem Projekt
            import uuid
            new_link_id = uuid.uuid4()
            
            new_link_query = """
                INSERT INTO l_user_project_timeentry 
                (hk_user_project_timeentry, hk_user, hk_project, timeentry_id, rec_src) 
                VALUES (%s, %s, %s, %s, %s)
            """
            
            db.execute(new_link_query, (
                new_link_id,
                user_id,
                new_project_id,
                str(entry_id),  # Behalte dieselbe timeentry_id
                'web_app'
            ))
            
            # Einfügen eines neuen Zeiteintrags mit dem neuen Link
            db.execute(details_query, (
                new_link_id,
                'web_app',
                data['datum'],
                data['beginn'],
                data['ende'],
                int(data.get('pause', 0)),
                data.get('arbeitsort', 'Büro'),
                data.get('beschreibung', '')
            ))
        
        db.commit()
        
        return jsonify({
            "success": True,
            "message": "Zeiteintrag erfolgreich aktualisiert"
        })
        
    except Exception as e:
        db.rollback()
        return jsonify({"error": f"Fehler beim Aktualisieren: {str(e)}"}), 500
    finally:
        db.close()

@time_matrix_bp.route("/api/time-entries/<uuid:entry_id>", methods=["DELETE"])
@jwt_required()
def delete_entry(entry_id):
    """
    API-Endpunkt zum Löschen eines Zeiteintrags.
    Angepasst für das Data-Vault-Schema.
    """
    current_user = get_jwt_identity()
    
    db = Database()
    try:
        # Benutzer-ID aus user_id (Email) abrufen
        user_result = db.fetch_one("SELECT hk_user FROM h_user WHERE user_id = %s", (current_user,))
        if not user_result:
            return jsonify({"error": "Benutzer nicht gefunden"}), 404
            
        user_id = str(user_result[0])  # UUID als String umwandeln
        
        # Zuerst Link-ID ermitteln
        link_result = db.fetch_one("""
            SELECT hk_user_project_timeentry 
            FROM l_user_project_timeentry 
            WHERE timeentry_id = %s AND hk_user = %s
        """, (str(entry_id), user_id))
        
        if not link_result:
            return jsonify({"error": "Zeiteintrag nicht gefunden oder keine Berechtigung"}), 404
            
        link_id = str(link_result[0])  # UUID als String umwandeln
        
        # Im Data Vault setzen wir einen Zeitstempel, aber löschen nicht wirklich
        # 1. Schließen des aktuellen Zeiteintrags in s_timeentry_details
        db.execute("""
            UPDATE s_timeentry_details 
            SET t_to = CURRENT_TIMESTAMP 
            WHERE hk_user_project_timeentry = %s AND t_to IS NULL
        """, (link_id,))
        
        # 2. Schließen des Links in l_user_project_timeentry
        db.execute("""
            UPDATE l_user_project_timeentry 
            SET t_to = CURRENT_TIMESTAMP 
            WHERE hk_user_project_timeentry = %s
        """, (link_id,))
        
        db.commit()
        
        return jsonify({
            "success": True,
            "message": "Zeiteintrag erfolgreich gelöscht"
        })
        
    except Exception as e:
        db.rollback()
        return jsonify({"error": f"Fehler beim Löschen: {str(e)}"}), 500
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

@time_matrix_bp.route("/api/debug/database-info", methods=["GET"])
@jwt_required()
def debug_database_info():
    """
    Debug-Endpunkt zur Analyse der Datenbankstruktur
    """
    db = Database()
    try:
        # Tabellenliste
        tables = db.fetch_all("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        
        # Informationen zum aktuellen Benutzer
        current_user = get_jwt_identity()
        user_info = db.fetch_one("""
            SELECT * FROM h_user WHERE user_id = %s
        """, (current_user,))
        
        user_columns = db.fetch_all("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'h_user'
            ORDER BY ordinal_position
        """)
        
        return jsonify({
            "tables": [t[0] for t in tables],
            "user_columns": [{"name": c[0], "type": c[1]} for c in user_columns],
            "current_user": current_user,
            "user_found": user_info is not None
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()