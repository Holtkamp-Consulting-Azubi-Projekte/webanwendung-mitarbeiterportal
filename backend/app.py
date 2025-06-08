from flask import Flask, render_template, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
from datetime import timedelta
from database import Database

# Import aller Blueprints
from auth import auth_bp
from profile import profile_bp
from project import project_bp
from customer import customer_bp
from time_matrix import time_matrix_bp
from dashboard import dashboard_bp

app = Flask(__name__, static_folder="static")

# JWT Konfiguration
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'super-geheim')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

# Datenbank-Konfiguration
app.config["DB_HOST"] = os.environ.get("DB_HOST", "localhost")
app.config["DB_NAME"] = os.environ.get("DB_NAME", "holtkamp")
app.config["DB_USER"] = os.environ.get("DB_USER", "postgres")
app.config["DB_PASSWORD"] = os.environ.get("DB_PASSWORD", "password")

jwt = JWTManager(app)
CORS(app, supports_credentials=True)

# Registriere alle Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(project_bp)
app.register_blueprint(customer_bp)
app.register_blueprint(time_matrix_bp)
app.register_blueprint(dashboard_bp)

@app.route('/')
def home():
    return render_template("index.html")

# Debug-Endpunkt, um Tabellenstrukturen zu überprüfen
@app.route("/api/debug/tables")
def debug_tables():
    db = Database()
    try:
        # Überprüfe, ob die s_user_current_project Tabelle existiert
        project_table_exists = db.fetch_one("""
            SELECT EXISTS (
               SELECT FROM information_schema.tables 
               WHERE table_name = 's_user_current_project'
            );
        """)
        
        # Überprüfe Projekteinträge für einen Beispielbenutzer
        sample_user = db.fetch_one("SELECT hk_user FROM h_user LIMIT 1")
        if sample_user:
            user_projects = db.fetch_all("""
                SELECT encode(hk_user, 'hex') as user_id, 
                       encode(hk_project, 'hex') as project_id, 
                       t_from, t_to
                FROM s_user_current_project
                WHERE hk_user = %s
                ORDER BY t_from DESC
            """, (sample_user[0],))
        else:
            user_projects = []
        
        return jsonify({
            "s_user_current_project_exists": project_table_exists[0] if project_table_exists else False,
            "sample_user_projects": [
                {
                    "user_id": p[0],
                    "project_id": p[1],
                    "t_from": p[2].isoformat() if p[2] else None,
                    "t_to": p[3].isoformat() if p[3] else None
                }
                for p in user_projects
            ]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@app.route("/api/debug/project-table")
def debug_project_table():
    db = Database()
    try:
        # Überprüfe, ob die Tabelle existiert
        table_exists = db.fetch_one("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 's_user_current_project'
            )
        """)
        
        # Wenn die Tabelle existiert, hole einige Einträge
        if table_exists and table_exists[0]:
            entries = db.fetch_all("""
                SELECT 
                    encode(hk_user, 'hex') as hk_user,
                    encode(hk_project, 'hex') as hk_project,
                    t_from,
                    t_to,
                    rec_src
                FROM s_user_current_project
                ORDER BY t_from DESC
                LIMIT 10
            """)
            
            formatted_entries = []
            for entry in entries:
                formatted_entries.append({
                    'hk_user': entry[0],
                    'hk_project': entry[1],
                    't_from': str(entry[2]),
                    't_to': str(entry[3]) if entry[3] else None,
                    'rec_src': entry[4]
                })
            
            return jsonify({
                'table_exists': True,
                'entries': formatted_entries
            })
        else:
            return jsonify({
                'table_exists': False,
                'message': 'Tabelle s_user_current_project existiert nicht'
            })
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500
    finally:
        db.close()

@app.route("/api/debug/check-projects")
def debug_check_projects():
    """Debug-Endpunkt zum Überprüfen aller Projekteinträge"""
    db = Database()
    try:
        # Überprüfe alle User und ihre Projekte
        users = db.fetch_all("""
            SELECT u.user_id, encode(u.hk_user, 'hex') as hk_user_hex
            FROM h_user u
            ORDER BY u.user_id
        """)
        
        result = []
        for user in users:
            user_email = user[0]
            user_hex = user[1]
            
            # Projekte für diesen User
            projects = db.fetch_all("""
                SELECT 
                    encode(cp.hk_project, 'hex') as project_hex,
                    cp.t_from,
                    cp.t_to,
                    p.project_name
                FROM s_user_current_project cp
                LEFT JOIN h_project h ON cp.hk_project = h.hk_project
                LEFT JOIN s_project_details p ON h.hk_project = p.hk_project AND p.t_to IS NULL
                WHERE cp.hk_user = decode(%s, 'hex')
                ORDER BY cp.t_from DESC
            """, (user_hex,))
            
            project_list = []
            for proj in projects:
                project_list.append({
                    'project_hex': proj[0],
                    't_from': str(proj[1]),
                    't_to': str(proj[2]) if proj[2] else None,
                    'project_name': proj[3] if proj[3] else 'Unbekannt',
                    'is_active': proj[2] is None
                })
                
            result.append({
                'email': user_email,
                'hk_user': user_hex,
                'projects': project_list,
                'has_active_project': any(p['is_active'] for p in project_list)
            })
            
        return jsonify({
            'users_with_projects': result
        })
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500
    finally:
        db.close()

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')
