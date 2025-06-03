from flask import Blueprint, request, jsonify, current_app
import psycopg2
import hashlib

customer_bp = Blueprint("customer", __name__)

def get_db_conn():
    return psycopg2.connect(
        host=current_app.config["DB_HOST"],
        database=current_app.config["DB_NAME"],
        user=current_app.config["DB_USER"],
        password=current_app.config["DB_PASSWORD"],
    )

def hash_hex(value):
    return hashlib.sha256(value.encode()).hexdigest()

@customer_bp.route("/api/customers", methods=["GET"])
def get_customers():
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT encode(hk_customer, 'hex') AS hk_customer, customer_name
        FROM h_customer
        ORDER BY customer_name
    """)
    customers = [{"hk_customer": r[0], "customer_name": r[1]} for r in cur.fetchall()]
    cur.close()
    conn.close()
    return jsonify(customers)

@customer_bp.route("/api/customers", methods=["POST"])
def add_customer():
    data = request.json
    hk_customer = hash_hex(data["customer_name"])
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO h_customer (hk_customer, customer_name, t_from, rec_src)
        VALUES (decode(%s, 'hex'), %s, NOW(), 'API')
        ON CONFLICT DO NOTHING
    """, (hk_customer, data["customer_name"]))
    cur.execute("""
        INSERT INTO s_customer_details (hk_customer, t_from, b_from, rec_src, address, contact_person)
        VALUES (decode(%s, 'hex'), NOW(), CURRENT_DATE, 'API', %s, %s)
    """, (
        hk_customer,
        data.get("address"),
        data.get("contact_person")
    ))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"hk_customer": hk_customer, "customer_name": data["customer_name"]})

@customer_bp.route("/api/customers/<hk_customer>", methods=["DELETE"])
def delete_customer(hk_customer):
    conn = get_db_conn()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM h_customer WHERE encode(hk_customer, 'hex') = %s", (hk_customer,))
        conn.commit()
        return jsonify({"message": "Kunde gelöscht"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

