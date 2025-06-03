"""
Zeitmatrix-Modul für das Mitarbeiterportal.
Implementiert die Verwaltung von Zeiteinträgen und die Zeitmatrix-Funktionalität über die Datenbank.
"""

from flask import Blueprint, request, jsonify
import os
import json
import time
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import Database
import hashlib

import logging

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
            except ValueError:
                errors.append("Ungültiges Format für Endzeit. Erwartet HH:MM.")

        if not errors: # Nur prüfen, wenn Datums/Zeitformate gültig sind
            # Kombiniere Datum und Zeiten
            start_datetime = datetime.combine(entry_date.date(), start_time_obj)

            if end_time_obj:
                end_datetime = datetime.combine(entry_date.date(), end_time_obj)
                # Prüfe ob Ende nach Beginn liegt
                if end_datetime <= start_datetime:
                    errors.append("Endzeit muss nach der Startzeit liegen")

    except Exception as e:
        errors.append(f"Allgemeiner Fehler bei der Datums/Zeit-Validierung: {str(e)}")

    return len(errors) == 0, errors

@time_matrix_bp.route("/api/time-entries", methods=["GET"])
@jwt_required()
def get_entries():
    logger.info("GET request received for time entries")
    current_user_email = get_jwt_identity()
    db = Database()
    try:
        # Hole den Benutzer anhand der E-Mail, um den hk_user zu bekommen
        user = db.get_user_by_email(current_user_email)
        if not user:
            return jsonify({'error': 'Benutzer nicht gefunden'}), 404

        hk_user = user[0] # hk_user ist das erste Feld

        # Hole alle Zeiteinträge für diesen Benutzer
        entries = db.fetch_all(
            """
            SELECT l.timeentry_id, s.entry_date, s.start_time, s.end_time, s.pause_minutes, s.work_location, s.description, p.project_name,
                   d.first_name, d.last_name
            FROM l_user_project_timeentry l
            JOIN s_timeentry_details s ON s.hk_user_project_timeentry = l.hk_user_project_timeentry AND s.t_to IS NULL
            JOIN h_project p ON p.hk_project = l.hk_project
            JOIN h_user u ON u.hk_user = l.hk_user
            JOIN s_user_details d ON d.hk_user = u.hk_user AND d.t_to IS NULL
            WHERE l.hk_user = %s
            ORDER BY s.entry_date DESC, s.start_time DESC
            """,
            (hk_user,)
        )

        # Formatiere die Ergebnisse
        formatted_entries = []
        for entry in entries:
            formatted_entries.append({
                'id': entry[0], # timeentry_id
                'datum': entry[1].strftime('%Y-%m-%d'), # entry_date
                'beginn': entry[2].strftime('%H:%M'), # start_time
                'ende': entry[3].strftime('%H:%M') if entry[3] else None, # end_time
                'pause': entry[4], # pause_minutes
                'arbeitsort': entry[5], # work_location
                'beschreibung': entry[6], # description
                'projekt': [entry[7]], # project_name (als Liste, um Kompatibilität zu wahren)
                'mitarbeiter': f"{entry[8]} {entry[9]}" # first_name, last_name
            })

        return jsonify(formatted_entries), 200

    except Exception as e:
        logger.error(f"Fehler beim Abrufen der Zeiteinträge: {e}")
        return jsonify({'error': 'Fehler beim Abrufen der Zeiteinträge'}), 500
    finally:
        db.close()

@time_matrix_bp.route("/api/time-entries", methods=["POST"])
@jwt_required()
def add_entry():
    logger.info("POST request received for time entry")
    current_user_email = get_jwt_identity()
    data = request.get_json()
    logger.info(f"POST data: {data}")
    if not data:
        logger.error("No data received in POST request")
        return jsonify({'error': 'Keine Daten erhalten'}), 400

    # Validiere den neuen Eintrag
    is_valid, errors = validate_time_entry(data)
    if not is_valid:
        logger.error(f"Validation errors in POST request: {errors}")
        return jsonify({'error': 'Validierungsfehler', 'details': errors}), 400

    db = Database()
    try:
        # Hole den Benutzer anhand der E-Mail
        user = db.get_user_by_email(current_user_email)
        if not user:
            db.rollback()
            return jsonify({'error': 'Benutzer nicht gefunden'}), 404

        hk_user = user[0] # hk_user

        # Hole oder erstelle das Projekt
        project_name = data['projekt'][0] if data.get('projekt') and len(data['projekt']) > 0 else None
        if not project_name:
            db.rollback()
            return jsonify({'error': 'Projektname fehlt'}), 400

        project = db.fetch_one(
            "SELECT hk_project FROM h_project WHERE project_name = %s",
            (project_name,)
        )

        hk_project = None
        if project:
            hk_project = project[0]
        else:
            # Projekt existiert nicht, erstelle es
            hk_project = hashlib.sha256(project_name.encode()).digest()
            now = datetime.utcnow()
            today = datetime.now().date()
            db.execute(
                """
                INSERT INTO h_project (hk_project, project_name, t_from, rec_src)
                VALUES (%s, %s, %s, %s)
                """,
                (hk_project, project_name, now, 'API')
            )
            db.execute(
                """
                INSERT INTO s_project_details
                (hk_project, t_from, b_from, rec_src, project_name)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (hk_project, now, today, 'API', project_name)
            )
            logger.info(f"Neues Projekt erstellt: {project_name}")

        # Erstelle eine eindeutige ID für den Zeiteintrag (kann auch ein Hash sein)
        # Verwenden wir die vom Frontend gesendete ID, falls vorhanden, sonst Timestamp
        timeentry_id = data.get('id', str(int(time.time() * 1000)))

        # Hash-Key für den Zeiteintrag erstellen
        hk_user_project_timeentry = hashlib.sha256(
                f"{hk_user}{hk_project}{timeentry_id}".encode()
            ).digest()

        now = datetime.utcnow()
        today = datetime.now().date()

        # Link-Tabelle (l_user_project_timeentry) einfügen
        db.execute(
            """
            INSERT INTO l_user_project_timeentry
            (hk_user_project_timeentry, hk_user, hk_project, timeentry_id, t_from, rec_src)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (hk_user_project_timeentry, hk_user, hk_project, timeentry_id, now, 'API')
        )

        # Satellite-Tabelle (s_timeentry_details) einfügen
        db.execute(
            """
            INSERT INTO s_timeentry_details
            (hk_user_project_timeentry, t_from, b_from, rec_src, entry_date, start_time, end_time, pause_minutes, work_location, description)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (hk_user_project_timeentry, now, today, 'API',
             datetime.strptime(data['datum'], '%Y-%m-%d').date(),
             datetime.strptime(data['beginn'], '%H:%M').time(),
             datetime.strptime(data['ende'], '%H:%M').time() if data.get('ende') else None,
             int(data.get('pause', 0)),
             data.get('arbeitsort', 'Office'),
             data.get('beschreibung', ''))
        )

        db.commit()
        logger.info(f"Entry added successfully with ID: {timeentry_id}")
        return jsonify({'status': 'ok', 'message': 'Eintrag gespeichert', 'id': timeentry_id}), 201

    except Exception as e:
        db.rollback()
        logger.error(f"Fehler beim Hinzufügen des Zeiteintrags: {e}")
        return jsonify({'error': 'Fehler beim Speichern des Zeiteintrags'}), 500
    finally:
        db.close()

@time_matrix_bp.route("/api/time-entries/<int:entry_id>", methods=["PUT"])
@jwt_required()
def update_entry(entry_id):
    logger.info(f"PUT request received for time entry ID: {entry_id}")
    current_user_email = get_jwt_identity()
    data = request.get_json()
    logger.info(f"PUT data: {data}")
    if not data:
        logger.error(f"No data received in PUT request for ID: {entry_id}")
        return jsonify({'error': 'Keine Daten erhalten'}), 400

    # Validiere den aktualisierten Eintrag
    is_valid, errors = validate_time_entry(data)
    if not is_valid:
        logger.error(f"Validation errors in PUT request for ID {entry_id}: {errors}")
        return jsonify({'error': 'Validierungsfehler', 'details': errors}), 400

    db = Database()
    try:
        # Hole den Benutzer anhand der E-Mail
        user = db.get_user_by_email(current_user_email)
        if not user:
            db.rollback()
            return jsonify({'error': 'Benutzer nicht gefunden'}), 404

        hk_user = user[0] # hk_user

        # Finde den Link-Eintrag anhand der timeentry_id und hk_user
        link_entry = db.fetch_one(
            """
            SELECT hk_user_project_timeentry, hk_project
            FROM l_user_project_timeentry
            WHERE timeentry_id = %s AND hk_user = %s
            """,
            (entry_id, hk_user)
        )

        if not link_entry:
            db.rollback()
            logger.warning(f"Link entry not found for ID {entry_id} and user {current_user_email}")
            return jsonify({'error': 'Eintrag nicht gefunden'}), 404

        hk_user_project_timeentry = link_entry[0]
        old_hk_project = link_entry[1]

        # Überprüfe, ob sich das Projekt geändert hat
        project_name = data['projekt'][0] if data.get('projekt') and len(data['projekt']) > 0 else None
        hk_project = old_hk_project

        if project_name:
            project = db.fetch_one(
                "SELECT hk_project FROM h_project WHERE project_name = %s",
                (project_name,)
            )
            if project:
                hk_project = project[0]
            else:
                # Neues Projekt, falls Projektname geändert und neues Projekt nicht existiert
                hk_project = hashlib.sha256(project_name.encode()).digest()
                now = datetime.utcnow()
                today = datetime.now().date()
                db.execute(
                    """
                    INSERT INTO h_project (hk_project, project_name, t_from, rec_src)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (hk_project, project_name, now, 'API')
                )
                db.execute(
                    """
                    INSERT INTO s_project_details
                    (hk_project, t_from, b_from, rec_src, project_name)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (hk_project, now, today, 'API', project_name)
                )
                logger.info(f"Neues Projekt während Update erstellt: {project_name}")

        # Aktuelle Details als historisch markieren
        now = datetime.utcnow()
        today = datetime.now().date()
        db.execute(
            """
            UPDATE s_timeentry_details
            SET t_to = %s, b_to = %s
            WHERE hk_user_project_timeentry = %s AND t_to IS NULL
            """,
            (now, today, hk_user_project_timeentry)
        )

        # Neue Details einfügen
        db.execute(
            """
            INSERT INTO s_timeentry_details
            (hk_user_project_timeentry, t_from, b_from, rec_src, entry_date, start_time, end_time, pause_minutes, work_location, description)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (hk_user_project_timeentry, now, today, 'API',
             datetime.strptime(data['datum'], '%Y-%m-%d').date(),
             datetime.strptime(data['beginn'], '%H:%M').time(),
             datetime.strptime(data['ende'], '%H:%M').time() if data.get('ende') else None,
             int(data.get('pause', 0)),
             data.get('arbeitsort', 'Office'),
             data.get('beschreibung', ''))
        )

        # Aktualisiere hk_project im Link, falls sich das Projekt geändert hat
        if hk_project != old_hk_project:
            db.execute(
                """
                UPDATE l_user_project_timeentry
                SET hk_project = %s
                WHERE hk_user_project_timeentry = %s
                """,
                (hk_project, hk_user_project_timeentry)
            )

        db.commit()
        logger.info(f"Entry updated successfully with ID: {entry_id}")
        return jsonify({'status': 'ok', 'message': 'Eintrag aktualisiert'}), 200

    except Exception as e:
        db.rollback()
        logger.error(f"Fehler beim Aktualisieren des Zeiteintrags: {e}")
        return jsonify({'error': 'Fehler beim Aktualisieren des Zeiteintrags'}), 500
    finally:
        db.close()

@time_matrix_bp.route('/<entry_id>', methods=['DELETE'])
@jwt_required()
def delete_entry(entry_id):
    logger.info(f"DELETE request received for time entry ID: {entry_id}")
    current_user_email = get_jwt_identity()
    db = Database()
    try:
        # Hole den Benutzer anhand der E-Mail
        user = db.get_user_by_email(current_user_email)
        if not user:
            db.rollback()
            return jsonify({'error': 'Benutzer nicht gefunden'}), 404

        hk_user = user[0] # hk_user

        # Finde den Link-Eintrag anhand der timeentry_id und hk_user
        link_entry = db.fetch_one(
            """
            SELECT hk_user_project_timeentry
            FROM l_user_project_timeentry
            WHERE timeentry_id = %s AND hk_user = %s
            """,
            (entry_id, hk_user)
        )

        if not link_entry:
            db.rollback()
            logger.warning(f"Link entry not found for ID {entry_id} and user {current_user_email}")
            return jsonify({'error': 'Eintrag nicht gefunden'}), 404

        hk_user_project_timeentry = link_entry[0]

        # Lösche den Satellite-Eintrag
        db.execute(
            """
            DELETE FROM s_timeentry_details
            WHERE hk_user_project_timeentry = %s
            """,
            (hk_user_project_timeentry,)
        )

        # Lösche den Link-Eintrag
        db.execute(
            """
            DELETE FROM l_user_project_timeentry
            WHERE hk_user_project_timeentry = %s
            """,
            (hk_user_project_timeentry,)
        )

        db.commit()
        logger.info(f"Entry deleted successfully with ID: {entry_id}")
        return jsonify({'status': 'ok', 'message': 'Eintrag gelöscht'}), 200

    except Exception as e:
        db.rollback()
        logger.error(f"Fehler beim Löschen des Zeiteintrags: {e}")
        return jsonify({'error': 'Fehler beim Löschen des Zeiteintrags'}), 500
    finally:
        db.close() 