from flask import Blueprint, request, jsonify, current_app as app
from flask_jwt_extended import jwt_required, get_jwt_identity
import psycopg2
import hashlib
import traceback  
import uuid
from database import Database  

customer_bp = Blueprint("customer", __name__)

def get_db_conn():
    """
    Stellt eine Verbindung zur Datenbank her und gibt diese zurück.
    
    Returns:
        psycopg2.connection: Eine aktive Datenbankverbindung
    """
    import psycopg2
    from flask import current_app as app
    
    conn = psycopg2.connect(
        host=app.config["DB_HOST"],
        database=app.config["DB_NAME"],
        user=app.config["DB_USER"],
        password=app.config["DB_PASSWORD"],
    )
    return conn

def hash_hex(value):
    return hashlib.sha256(value.encode()).hexdigest()

def none_if_empty(val):
    return val if val not in ("", None) else None

@customer_bp.route('/api/customers', methods=['GET'])
def get_customers():
    try:
        db = Database()
        cur = db.cur
        cur.execute("""
            SELECT
                c.hk_customer::text as hk_customer,
                c.customer_name,
                cd.address,
                cd.contact_person
            FROM h_customer c
            LEFT JOIN s_customer_details cd ON c.hk_customer = cd.hk_customer
                AND cd.t_to IS NULL
            WHERE c.t_to IS NULL  
            ORDER BY c.customer_name
        """)
        customers = []
        for row in cur.fetchall():
            customers.append({
                'hk_customer': row[0],
                'customer_name': row[1],
                'address': row[2],
                'contact_person': row[3]
            })
        return jsonify(customers), 200
    except Exception as e:
        traceback.print_exc()  # Jetzt funktioniert diese Zeile
        return jsonify({'error': str(e)}), 500

@customer_bp.route('/api/customers', methods=['POST'])
def add_customer():
    try:
        data = request.json
        if not data or not data.get('customer_name'):
            return jsonify({'error': 'Kundenname ist erforderlich'}), 400

        conn = get_db_conn()
        cur = conn.cursor()

        # Prüfen, ob Kunde bereits existiert
        cur.execute("""
            SELECT c.hk_customer::text, t_to 
            FROM h_customer c
            WHERE customer_name = %s
        """, (data['customer_name'],))
        
        existing = cur.fetchone()
        
        if existing:
            # Wenn Kunde existiert und nicht historisiert, Fehler zurückgeben
            if existing[1] is None:
                return jsonify({
                    'error': 'Ein Kunde mit diesem Namen existiert bereits'
                }), 400
                
            # Wenn historisiert, reaktivieren
            hk_customer = existing[0]
            
            # Den Hub-Eintrag aktualisieren (re-aktivieren)
            cur.execute("""
                UPDATE h_customer
                SET t_to = NULL
                WHERE hk_customer::text = %s
            """, (hk_customer,))
        else:
            # Neuen Kunden erstellen
            hk_customer = str(uuid.uuid4())
            
            # Hub-Eintrag
            cur.execute("""
                INSERT INTO h_customer (hk_customer, customer_name, t_from, rec_src)
                VALUES (%s, %s, CURRENT_TIMESTAMP, %s)
            """, (hk_customer, data['customer_name'], 'API'))

        # Satellit-Eintrag für Kundendetails
        cur.execute("""
            INSERT INTO s_customer_details (
                hk_customer, t_from, b_from, rec_src,
                address, contact_person
            ) VALUES (
                %s, CURRENT_TIMESTAMP, CURRENT_DATE, %s,
                %s, %s
            )
        """, (
            hk_customer,
            'API',
            data.get('address', ''),
            data.get('contact_person', '')
        ))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'hk_customer': hk_customer,
            'message': 'Kunde erfolgreich angelegt'
        }), 201
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@customer_bp.route("/api/customers/<hk_customer>", methods=["DELETE"])
def delete_customer(hk_customer):
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        
        # Prüfen, ob noch Projekte mit diesem Kunden verknüpft sind
        cur.execute("""
            SELECT COUNT(*) FROM s_project_details 
            WHERE customer_id::text = %s AND t_to IS NULL
        """, (hk_customer,))
        
        project_count = cur.fetchone()[0]
        if project_count > 0:
            return jsonify({
                'error': 'Diesem Kunden sind noch Projekte zugeordnet. Bitte zuerst Projekte löschen.'
            }), 400
        
        # Wenn keine Projekte verknüpft sind, kann gelöscht werden
        cur.execute("""
            UPDATE h_customer
            SET t_to = CURRENT_TIMESTAMP
            WHERE hk_customer::text = %s
        """, (hk_customer,))
        
        cur.execute("""
            UPDATE s_customer_details
            SET t_to = CURRENT_TIMESTAMP
            WHERE hk_customer::text = %s AND t_to IS NULL
        """, (hk_customer,))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Kunde erfolgreich gelöscht'
        }), 200
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# Beim Bearbeiten eines Kunden
@customer_bp.route('/api/customers/<hk_customer>', methods=['PUT'])
def update_customer(hk_customer):
    try:
        data = request.json
        if not data or not data.get('customer_name'):
            return jsonify({'error': 'Kundenname ist erforderlich'}), 400

        conn = get_db_conn()
        cur = conn.cursor()

        # Prüfen, ob der Kunde existiert
        cur.execute("""
            SELECT 1 FROM h_customer
            WHERE hk_customer::text = %s AND t_to IS NULL
        """, (hk_customer,))
        
        if not cur.fetchone():
            return jsonify({'error': 'Kunde nicht gefunden'}), 404

        # Den Hub-Eintrag aktualisieren
        cur.execute("""
            UPDATE h_customer
            SET customer_name = %s
            WHERE hk_customer::text = %s
        """, (data['customer_name'], hk_customer))

        # Erst den alten Satelliten-Eintrag historisieren
        cur.execute("""
            UPDATE s_customer_details
            SET t_to = CURRENT_TIMESTAMP
            WHERE hk_customer::text = %s AND t_to IS NULL
        """, (hk_customer,))

        # Dann einen neuen Satelliten-Eintrag erstellen
        cur.execute("""
            INSERT INTO s_customer_details (
                hk_customer, t_from, b_from, rec_src,
                address, contact_person
            ) VALUES (
                %s, CURRENT_TIMESTAMP, CURRENT_DATE, %s,
                %s, %s
            )
        """, (
            hk_customer,
            'API',
            data.get('address', ''),
            data.get('contact_person', '')
        ))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Kunde erfolgreich aktualisiert'
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# Beim Abrufen eines einzelnen Kunden
@customer_bp.route('/api/customers/<hk_customer>', methods=['GET'])
def get_customer(hk_customer):
    try:
        conn = get_db_conn()
        cur = conn.cursor()

        cur.execute("""
            SELECT 
                c.customer_name,
                cd.address,
                cd.contact_person
            FROM h_customer c
            JOIN s_customer_details cd ON c.hk_customer = cd.hk_customer
            WHERE c.hk_customer::text = %s AND cd.t_to IS NULL
        """, (hk_customer,))

        customer = cur.fetchone()
        if not customer:
            return jsonify({'error': 'Kunde nicht gefunden'}), 404

        customer_data = {
            'hk_customer': hk_customer,
            'customer_name': customer[0],
            'address': customer[1],
            'contact_person': customer[2]
        }

        cur.close()
        conn.close()

        return jsonify(customer_data), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

