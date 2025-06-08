from flask import Blueprint, request, jsonify, current_app as app
from datetime import datetime
from flask_jwt_extended import jwt_required
import traceback
import uuid
import psycopg2
from database import Database

project_bp = Blueprint("project", __name__)
customer_bp = Blueprint("customer", __name__)

def parse_date(date_str):
    if not date_str or date_str.strip() == "":
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception as e:
        print(f"Fehler beim Parsen des Datums {date_str}: {e}")
        return None

def get_db_conn():
    return psycopg2.connect(
        host=app.config["DB_HOST"],
        database=app.config["DB_NAME"],
        user=app.config["DB_USER"],
        password=app.config["DB_PASSWORD"],
    )

@project_bp.route('/api/projects', methods=['GET'])
@jwt_required()
def get_projects():
    try:
        db = Database()
        cur = db.cur
        cur.execute("""
            SELECT
                p.hk_project::text AS hk_project,
                pd.project_name,
                pd.description,
                pd.start_date,
                pd.end_date,
                pd.budget_days,
                pd.customer_id::text AS customer_id,
                c.customer_name
            FROM h_project p
            JOIN s_project_details pd ON p.hk_project = pd.hk_project
                AND pd.t_to IS NULL
            LEFT JOIN h_customer c ON pd.customer_id = c.hk_customer
            ORDER BY pd.project_name
        """)
        
        projects = []
        for row in cur.fetchall():
            projects.append({
                'hk_project': row[0],
                'project_name': row[1],
                'description': row[2],
                'start_date': row[3].isoformat() if row[3] else None,
                'end_date': row[4].isoformat() if row[4] else None,
                'budget_days': row[5],
                'customer_id': row[6],
                'customer_name': row[7]
            })
        
        return jsonify(projects), 200
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@project_bp.route("/api/projects", methods=["POST"])
def create_project():
    try:
        data = request.json
        if not data or not data.get("project_name") or not data.get("customer_id"):
            return jsonify({
                "error": "Projektname und Kunde sind erforderlich"
            }), 400
        
        # Daten validieren und aufbereiten
        start_date = parse_date(data.get("start_date"))
        end_date = parse_date(data.get("end_date"))
        
        # Kritische Änderung: Leere Strings für budget_days in None umwandeln
        budget_days = data.get("budget_days")
        if budget_days is None or budget_days == "":
            budget_days = None
        else:
            # Versuch, in Integer umzuwandeln, falls möglich
            try:
                budget_days = int(budget_days)
            except (ValueError, TypeError):
                budget_days = None
        
        # Projekt-ID erzeugen
        hk_project = str(uuid.uuid4())
        customer_id = data.get("customer_id")
        
        conn = get_db_conn()
        cur = conn.cursor()
        
        # Hub (Projekt anlegen)
        cur.execute("""
            INSERT INTO h_project (hk_project, project_name, t_from, rec_src)
            VALUES (%s, %s, NOW(), 'API')
        """, (hk_project, data["project_name"]))
        
        # Satellite (Projektdetails)
        cur.execute("""
            INSERT INTO s_project_details (
                hk_project, t_from, b_from, rec_src, project_name, description,
                customer_id, start_date, end_date, budget_days
            ) VALUES (
                %s, NOW(), CURRENT_DATE, 'API', %s, %s,
                %s, %s, %s, %s
            )
        """, (
            hk_project,
            data["project_name"],
            data.get("description") or "",
            customer_id,
            start_date,
            end_date,
            budget_days  # Hier wird NULL übergeben, wenn es leer ist
        ))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "hk_project": hk_project,
            "message": "Projekt erfolgreich angelegt"
        }), 201
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@project_bp.route("/api/projects/<hk_project>", methods=["GET"])
def get_project(hk_project):
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                p.hk_project::text as hk_project,
                pd.project_name,
                pd.description,
                pd.customer_id::text as customer_id,
                pd.start_date,
                pd.end_date,
                pd.budget_days,
                c.customer_name
            FROM h_project p
            JOIN s_project_details pd ON p.hk_project = pd.hk_project
                AND pd.t_to IS NULL
            LEFT JOIN h_customer c ON pd.customer_id = c.hk_customer
            WHERE p.hk_project::text = %s
        """, (hk_project,))
        
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "Projekt nicht gefunden"}), 404
            
        project = {
            'hk_project': row[0],
            'project_name': row[1],
            'description': row[2],
            'customer_id': row[3],
            'start_date': row[4].isoformat() if row[4] else None,
            'end_date': row[5].isoformat() if row[5] else None,
            'budget_days': row[6],
            'customer_name': row[7]
        }
        
        cur.close()
        conn.close()
        
        return jsonify(project), 200
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@project_bp.route("/api/projects/<hk_project>", methods=["PUT"])
def edit_project(hk_project):
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Keine Daten gesendet"}), 400
            
        # Aufbereitung der Daten
        def none_if_empty(val):
            if val is None or (isinstance(val, str) and val.strip() == ""):
                return None
            return val
            
        start_date = parse_date(data.get("start_date"))
        end_date = parse_date(data.get("end_date"))
        
        # Kritische Änderung: Leere Strings für budget_days in None umwandeln
        budget_days = data.get("budget_days")
        if budget_days is None or budget_days == "":
            budget_days = None
        else:
            # Versuch, in Integer umzuwandeln, falls möglich
            try:
                budget_days = int(budget_days)
            except (ValueError, TypeError):
                budget_days = None
        
        conn = get_db_conn()
        cur = conn.cursor()
        
        # Prüfen ob Projekt existiert
        cur.execute("""
            SELECT 1 FROM h_project WHERE hk_project::text = %s
        """, (hk_project,))
        
        if not cur.fetchone():
            return jsonify({"error": "Projekt nicht gefunden"}), 404
            
        # Altes Satellite historisieren
        cur.execute("""
            UPDATE s_project_details
            SET t_to = NOW()
            WHERE hk_project::text = %s AND t_to IS NULL
        """, (hk_project,))
        
        # Neues Satellite
        cur.execute("""
            INSERT INTO s_project_details (
                hk_project, t_from, b_from, rec_src, project_name, description,
                customer_id, start_date, end_date, budget_days
            ) VALUES (
                %s, NOW(), CURRENT_DATE, 'API', %s, %s,
                %s, %s, %s, %s
            )
        """, (
            hk_project,
            data["project_name"],
            none_if_empty(data.get("description")),
            data["customer_id"],
            start_date,
            end_date,
            budget_days  # Hier wird NULL übergeben, wenn es leer ist
        ))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Projekt erfolgreich aktualisiert"
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@project_bp.route("/api/projects/<hk_project>", methods=["DELETE"])
def delete_project(hk_project):
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        
        # Historisieren statt löschen (Data Vault Prinzip)
        cur.execute("""
            UPDATE h_project
            SET t_to = NOW()
            WHERE hk_project::text = %s
        """, (hk_project,))
        
        # Auch alle Satellite-Einträge historisieren
        cur.execute("""
            UPDATE s_project_details
            SET t_to = NOW()
            WHERE hk_project::text = %s AND t_to IS NULL
        """, (hk_project,))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Projekt erfolgreich gelöscht"
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@customer_bp.route("/api/customers/<hk_customer>", methods=["DELETE"])
def delete_customer(hk_customer):
    conn = get_db_conn()
    cur = conn.cursor()
    try:
        # Prüfen, ob noch Projekte mit diesem Kunden verknüpft sind
        cur.execute("""
            SELECT COUNT(*) FROM s_project_details 
            WHERE customer_id::text = %s AND t_to IS NULL
        """, (hk_customer,))
        count = cur.fetchone()[0]
        
        if count > 0:
            return jsonify({
                "error": "Kunde kann nicht gelöscht werden, da noch Projekte damit verknüpft sind.",
                "projectCount": count
            }), 400
            
        # Wenn keine Projekte verknüpft sind, kann gelöscht werden
        cur.execute("DELETE FROM h_customer WHERE hk_customer::text = %s", (hk_customer,))
        conn.commit()
        return jsonify({"message": "Kunde erfolgreich gelöscht"}), 200
    except Exception as e:
        conn.rollback()
        print(f"Fehler beim Löschen des Kunden: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()
