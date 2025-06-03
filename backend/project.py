from flask import Blueprint, jsonify, request
import psycopg2
import os

project_bp = Blueprint('project_bp', __name__)

def get_db_conn():
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "db"),
        database=os.getenv("POSTGRES_DB", "mitarbeiterportal"),
        user=os.getenv("POSTGRES_USER", "admin"),
        password=os.getenv("POSTGRES_PASSWORD", "secret")
    )

# Hilfsfunktion zur Serialisierung
def to_serializable(row, colnames):
    result = {}
    for key, value in zip(colnames, row):
        if isinstance(value, memoryview):
            value = value.tobytes().hex()
        result[key] = value
    return result

# Alle Projekte abrufen (inkl. Kunde)
@project_bp.route("/api/projects", methods=["GET"])
def get_projects():
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT 
            s.hk_project,
            s.project_name,
            c.customer_name,
            s.start_date,
            s.end_date,
            s.budget_days,
            s.description
        FROM s_project_details s
        LEFT JOIN h_customer c ON s.customer_id = c.hk_customer
        WHERE s.t_to IS NULL
    """)
    rows = cur.fetchall()
    colnames = [desc[0] for desc in cur.description]
    cur.close()
    conn.close()
    return jsonify([to_serializable(row, colnames) for row in rows])
