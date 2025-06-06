from flask import Blueprint, request, jsonify, current_app as app
import psycopg2
import hashlib

customer_bp = Blueprint("customer", __name__)

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

@customer_bp.route("/api/customers", methods=["GET"])
def get_customers():
    conn = get_db_conn()
    cur = conn.cursor()
    
    print("DEBUG: API-Aufruf an /api/customers")
    
    cur.execute("""
        SELECT 
            encode(hk_customer, 'hex') as hk_customer,
            customer_name
        FROM h_customer
        WHERE t_to IS NULL  -- Nur aktive Kunden
        ORDER BY customer_name
    """)
    customers = cur.fetchall()
    
    print(f"DEBUG: SQL-Abfrage ausgeführt, {len(customers)} Einträge gefunden")
    print(f"DEBUG: Rohdaten: {customers}")
    
    result = [{"hk_customer": c[0], "customer_name": c[1]} for c in customers]
    print(f"DEBUG: Formatierte Daten: {result}")
    
    cur.close()
    conn.close()
    return jsonify(result)

@customer_bp.route("/api/customers", methods=["POST"])
def add_customer():
    data = request.json
    hk_customer = hash_hex(data["customer_name"])
    conn = get_db_conn()
    cur = conn.cursor()
    
    # Prüfen, ob der Kunde bereits existiert
    cur.execute("""
        SELECT encode(hk_customer, 'hex'), t_to 
        FROM h_customer 
        WHERE encode(hk_customer, 'hex') = %s
    """, (hk_customer,))
    
    existing = cur.fetchone()
    
    if existing and existing[1] is not None:
        # Reaktiviere historisierten Kunden
        cur.execute("""
            UPDATE h_customer 
            SET t_to = NULL, t_from = NOW()
            WHERE encode(hk_customer, 'hex') = %s
        """, (hk_customer,))
        
        # Neue Kundendetails anlegen
        cur.execute("""
            INSERT INTO s_customer_details (hk_customer, t_from, b_from, rec_src, address, contact_person)
            VALUES (decode(%s, 'hex'), NOW(), CURRENT_DATE, 'API', %s, %s)
        """, (
            hk_customer,
            data.get("address"),
            data.get("contact_person")
        ))
    elif not existing:
        # Neuen Kunden anlegen
        cur.execute("""
            INSERT INTO h_customer (hk_customer, customer_name, t_from, rec_src)
            VALUES (decode(%s, 'hex'), %s, NOW(), 'API')
        """, (hk_customer, data["customer_name"]))
        
        # Kundendetails anlegen
        cur.execute("""
            INSERT INTO s_customer_details (hk_customer, t_from, b_from, rec_src, address, contact_person)
            VALUES (decode(%s, 'hex'), NOW(), CURRENT_DATE, 'API', %s, %s)
        """, (
            hk_customer,
            data.get("address"),
            data.get("contact_person")
        ))
    
    # Wenn Kunde bereits existiert und aktiv ist, nichts tun
    
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"hk_customer": hk_customer, "customer_name": data["customer_name"]})

@customer_bp.route("/api/customers/<hk_customer>", methods=["DELETE"])
def delete_customer(hk_customer):
    conn = get_db_conn()
    cur = conn.cursor()
    try:
        # Prüfen, ob noch Projekte mit diesem Kunden verknüpft sind
        cur.execute("""
            SELECT COUNT(*) FROM s_project_details 
            WHERE customer_id = decode(%s, 'hex') AND t_to IS NULL
        """, (hk_customer,))
        project_count = cur.fetchone()[0]
        
        if project_count > 0:
            return jsonify({
                "error": f"Kunde kann nicht gelöscht werden, da noch {project_count} Projekte damit verknüpft sind."
            }), 400
        
        # Kundendetails historisieren (nicht physisch löschen)
        cur.execute("""
            UPDATE s_customer_details 
            SET t_to = NOW() 
            WHERE hk_customer = decode(%s, 'hex') AND t_to IS NULL
        """, (hk_customer,))
            
        # Auch den Hub-Eintrag historisieren (nicht physisch löschen)
        cur.execute("""
            UPDATE h_customer
            SET t_to = NOW()
            WHERE encode(hk_customer, 'hex') = %s
        """, (hk_customer,))
        
        conn.commit()
        return jsonify({"message": "Kunde erfolgreich gelöscht"}), 200
    except Exception as e:
        conn.rollback()
        print(f"Fehler beim Löschen des Kunden: {e}")
        return jsonify({"error": "Kunde konnte nicht gelöscht werden: " + str(e)}), 500
    finally:
        cur.close()
        conn.close()

