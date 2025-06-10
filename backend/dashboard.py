from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import Database

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/api/dashboard/summary', methods=['GET'])
@jwt_required()
def dashboard_summary():
    db = Database()
    try:
        user = get_jwt_identity()
        # Hole User-ID (UUID) aus der Datenbank
        user_result = db.fetch_one("SELECT hk_user FROM h_user WHERE user_id = %s", (user,))
        if not user_result:
            return jsonify({"error": "Benutzer nicht gefunden"}), 404
        user_id = str(user_result[0])

        # Projekte und gebuchte Stunden
        projects = db.fetch_all("""
            SELECT p.project_name, 
                   SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time))/3600 - COALESCE(s.pause_minutes,0)/60.0) as stunden
            FROM l_user_project_timeentry l
            JOIN h_project p ON l.hk_project = p.hk_project
            JOIN s_timeentry_details s ON l.hk_user_project_timeentry = s.hk_user_project_timeentry
            WHERE l.hk_user = %s AND l.t_to IS NULL
            GROUP BY p.project_name
            ORDER BY stunden DESC
        """, (user_id,))
        projektStunden = [{"projektName": row[0], "stunden": float(row[1])} for row in projects]

        # Zeiteinträge der letzten 7 Tage (für Wochenchart)
        week = db.fetch_all("""
            SELECT s.entry_date, 
                   SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time))/3600 - COALESCE(s.pause_minutes,0)/60.0) as stunden
            FROM l_user_project_timeentry l
            JOIN s_timeentry_details s ON l.hk_user_project_timeentry = s.hk_user_project_timeentry
            WHERE l.hk_user = %s AND l.t_to IS NULL
                  AND s.entry_date >= CURRENT_DATE - INTERVAL '6 days'
            GROUP BY s.entry_date
            ORDER BY s.entry_date
        """, (user_id,))
        wochenStunden = [{"datum": str(row[0]), "stunden": float(row[1])} for row in week]

        # Top 3 Projekte
        topProjekte = projektStunden[:3]

        # Arbeitsorte (letzte 30 Tage)
        standorte = db.fetch_all("""
            SELECT s.work_location, 
                   SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time))/3600 - COALESCE(s.pause_minutes,0)/60.0) as stunden
            FROM l_user_project_timeentry l
            JOIN s_timeentry_details s ON l.hk_user_project_timeentry = s.hk_user_project_timeentry
            WHERE l.hk_user = %s AND l.t_to IS NULL
                  AND s.entry_date >= CURRENT_DATE - INTERVAL '29 days'
            GROUP BY s.work_location
            ORDER BY stunden DESC
        """, (user_id,))
        standortStunden = [{"standort": row[0], "stunden": float(row[1])} for row in standorte]

        # Monatszusammenfassung
        monatsSummary = db.fetch_one("""
            SELECT COUNT(DISTINCT s.entry_date) as arbeitstage,
                   SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time))/3600 - COALESCE(s.pause_minutes,0)/60.0) as gesamtstunden
            FROM l_user_project_timeentry l
            JOIN s_timeentry_details s ON l.hk_user_project_timeentry = s.hk_user_project_timeentry
            WHERE l.hk_user = %s AND l.t_to IS NULL
                  AND date_trunc('month', s.entry_date) = date_trunc('month', CURRENT_DATE)
        """, (user_id,))
        monatsSummary = {
            "arbeitstage": int(monatsSummary[0] or 0),
            "gesamtstunden": float(monatsSummary[1] or 0)
        }

        return jsonify({
            "projektStunden": projektStunden,
            "wochenStunden": wochenStunden,
            "topProjekte": topProjekte,
            "standortStunden": standortStunden,
            "monatsSummary": monatsSummary
        })
    finally:
        db.close()