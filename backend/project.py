from flask import Blueprint, request, jsonify, current_app as app
import psycopg2
import hashlib
from datetime import datetime

project_bp = Blueprint("project", __name__)

def parse_date(date_str):
    if not date_str or date_str.strip() == "":
        return None
    try:
        # Akzeptiert beide Formate: "YYYY-MM-DD" (ISO) und "DD.MM.YYYY" (deutsch)
        if "-" in date_str:
            return date_str  # schon korrektes Format
        return datetime.strptime(date_str, "%d.%m.%Y").strftime("%Y-%m-%d")
    except Exception as e:
        print("Datum konnte nicht geparst werden:", date_str, e)
        return None

def get_db_conn():
    return psycopg2.connect(
        host=app.config["DB_HOST"],
        database=app.config["DB_NAME"],
        user=app.config["DB_USER"],
        password=app.config["DB_PASSWORD"],
    )

def hash_hex(value):
    return hashlib.sha256(value.encode()).hexdigest()

def none_if_empty(val):
    return val if val not in ("", None) else None

# --- Projekte auflisten (nur aktuelle Satelliten) ---
@project_bp.route("/api/projects", methods=["GET"])
def get_projects():
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT
            encode(p.hk_project, 'hex') AS hk_project,
            p.project_name,
            p.description,
            c.customer_name,
            encode(p.customer_id, 'hex') AS customer_id,
            p.start_date,
            p.end_date,
            p.budget_days
        FROM s_project_details p
        LEFT JOIN h_customer c ON p.customer_id = c.hk_customer
        WHERE p.t_to IS NULL
        ORDER BY p.start_date NULLS LAST, p.project_name
    """)
    colnames = [desc[0] for desc in cur.description]
    rows = cur.fetchall()
    cur.close()
    conn.close()
    # Fix für memoryview (BYTEA)
    def fix_types(row):
        return {
            k: (v.tobytes().hex() if isinstance(v, memoryview) else v)
            for k, v in zip(colnames, row)
        }
    return jsonify([fix_types(row) for row in rows])

# --- Projekt anlegen ---
@project_bp.route("/api/projects", methods=["POST"])
def create_project():
    data = request.json
    print("Request JSON:", data)
    start_date = parse_date(data.get("start_date"))
    end_date = parse_date(data.get("end_date"))
    budget_days = data.get("budget_days") or None

    conn = get_db_conn()
    cur = conn.cursor()
    # Projekt-Hash (im Frontend erzeugt, sonst hier)
    hk_project = data.get("hk_project") or hash_hex(data["project_name"])
    customer_id = data["customer_id"]
    # Hub (ON CONFLICT für Mehrfach-Einfügen)
    cur.execute("""
        INSERT INTO h_project (hk_project, project_name, t_from, rec_src)
        VALUES (decode(%s, 'hex'), %s, NOW(), 'API')
        ON CONFLICT DO NOTHING
    """, (hk_project, data["project_name"]))
    # Satellite
    cur.execute("""
        INSERT INTO s_project_details (
            hk_project, t_from, b_from, rec_src, project_name, description,
            customer_id, start_date, end_date, budget_days
        ) VALUES (
            decode(%s, 'hex'), NOW(), CURRENT_DATE, 'API', %s, %s,
            decode(%s, 'hex'), %s, %s, %s
        )
    """, (
        hk_project,
        data["project_name"],
        data.get("description"),
        customer_id,
        start_date,   # hier das vorbereitete start_date
        end_date,     # hier das vorbereitete end_date
        budget_days
    ))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"status": "created"})

# --- Projekt bearbeiten (PUT) ---
@project_bp.route("/api/projects/<hk_project>", methods=["PUT"])
def edit_project(hk_project):
    data = request.json
    conn = get_db_conn()
    cur = conn.cursor()
    # Altes Satellite historisieren
    cur.execute("""
        UPDATE s_project_details
        SET t_to = NOW()
        WHERE encode(hk_project, 'hex') = %s AND t_to IS NULL
    """, (hk_project,))
    # Neues Satellite
    cur.execute("""
        INSERT INTO s_project_details (
            hk_project, t_from, b_from, rec_src, project_name, description,
            customer_id, start_date, end_date, budget_days
        ) VALUES (
            decode(%s, 'hex'), NOW(), CURRENT_DATE, 'API', %s, %s,
            decode(%s, 'hex'), %s, %s, %s
        )
    """, (
        hk_project,
        data["project_name"],
        data.get("description"),
        data["customer_id"],
        none_if_empty(data.get("start_date")),
        none_if_empty(data.get("end_date")),
        none_if_empty(data.get("budget_days")),
    ))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"status": "updated"})

# --- Projekt löschen (soft, Satellite historisieren) ---
@project_bp.route("/api/projects/<hk_project>", methods=["DELETE"])
def delete_project(hk_project):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("""
        UPDATE s_project_details
        SET t_to = NOW()
        WHERE encode(hk_project, 'hex') = %s AND t_to IS NULL
    """, (hk_project,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"status": "deleted"})
