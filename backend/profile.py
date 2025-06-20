from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from database import Database
import traceback
import binascii

profile_bp = Blueprint("profile", __name__)

@profile_bp.route("/api/profile", methods=["GET", "PUT", "OPTIONS"])
@jwt_required()
def profile():
    if request.method == "OPTIONS":
        return jsonify({}), 200
        
    current_user_email = get_jwt_identity()
    print(f"⭐️ Benutzer-Email: {current_user_email}")
    db = Database()
    
    try:
        if request.method == "GET":
            print("⭐️ GET-Methode aufgerufen")
            
            # WICHTIG: Abfrage anpassen, um is_admin zu holen
            user = db.fetch_one("""
                SELECT 
                    h.hk_user, 
                    h.user_id, 
                    s.first_name, 
                    s.last_name, 
                    s.position, 
                    s.telefon, 
                    s.core_hours_start,
                    s.core_hours_end,
                    s.is_admin  -- Wichtig: is_admin muss mit abgefragt werden
                FROM 
                    h_user h
                JOIN 
                    s_user_details s ON h.hk_user = s.hk_user
                WHERE 
                    h.user_id = %s AND s.t_to IS NULL
            """, (current_user_email,))
            
            if not user:
                return jsonify({"error": "Benutzer nicht gefunden"}), 404
            
            # DEBUG-Ausgabe
            print(f"⭐️ Abfrageergebnis: {user}")
            print(f"⭐️ is_admin Wert: {user[8]}")
                
            # Aktuelles Projekt abrufen
            current_project = db.fetch_one("""
                SELECT p.project_name, p.hk_project
                FROM s_user_current_project ucp 
                JOIN h_project p ON ucp.hk_project = p.hk_project
                WHERE ucp.hk_user = %s AND ucp.t_to IS NULL 
                ORDER BY ucp.t_from DESC LIMIT 1
            """, (user[0],))
            
            # Nutzerdaten für die Antwort zusammenstellen
            response_data = {
                "hk_user": str(user[0]),
                "email": user[1],
                "firstName": user[2],
                "lastName": user[3],
                "position": user[4],
                "telefon": user[5],
                "coreHoursStart": user[6].strftime("%H:%M") if user[6] else None,
                "coreHoursEnd": user[7].strftime("%H:%M") if user[7] else None,
                "isAdmin": bool(user[8]),  # Wichtig: is_admin als Boolean zurückgeben
                "currentProject": current_project[0] if current_project else None,
                "currentProjectId": str(current_project[1]) if current_project else None
            }
            
            print(f"⭐️ Antwortdaten: {response_data}")
            return jsonify(response_data)
            
        elif request.method == "PUT":
            print("⭐️ PUT-Methode aufgerufen")
            user = db.get_user_by_email(current_user_email)
            if not user:
                return jsonify({"error": "Benutzer nicht gefunden"}), 404
                
            update_data = request.get_json()
            print(f"⭐️ Erhaltene Daten: {update_data}")
            
            # WICHTIG: Das currentProject-Attribut extrahieren
            current_project = update_data.get('currentProject')
            print(f"⭐️ Aktuelles Projekt aus Request: {current_project}")
            
            # Aktualisieren der Benutzerdetails (ohne Projekt)
            db.update_user_details(user[0], update_data)
            print("⭐️ Benutzerdetails aktualisiert")
            
            # Aktualisiere das Projekt, wenn es im Request enthalten ist
            if 'currentProject' in update_data:
                try:
                    if current_project:  # Wenn ein Projekt angegeben wurde
                        print(f"⭐️ Konvertiere Projekt-ID {current_project} zu bytes")
                        project_id_bytes = bytes.fromhex(current_project)
                    else:  # Wenn kein Projekt angegeben wurde (leerer String oder null)
                        project_id_bytes = None
                        print("⭐️ Setze Projekt auf None (kein Projekt)")
                    
                    # Rufe die update_user_project Methode auf
                    print(f"⭐️ Rufe update_user_project auf mit hk_user={user[0].hex() if isinstance(user[0], bytes) else user[0]} und project={current_project}")
                    db.update_user_project(user[0], project_id_bytes)
                    print("⭐️ Projektaktualisierung abgeschlossen")
                    
                    # Direkte Prüfung nach dem Update
                    print("⭐️ Überprüfe aktualisiertes Projekt direkt aus der Datenbank:")
                    check = db.fetch_one("""
                        SELECT encode(hk_project, 'hex')
                        FROM s_user_current_project
                        WHERE hk_user = %s AND t_to IS NULL
                        ORDER BY t_from DESC LIMIT 1
                    """, (user[0],))
                    
                    if check:
                        print(f"⭐️ Projekt nach Update: {check[0]}")
                    else:
                        print("⭐️ WARNUNG: Kein aktives Projekt nach dem Update gefunden!")
                        
                except ValueError as e:
                    print(f"⚠️ Fehler bei Konvertierung der Projekt-ID: {e}")
                    return jsonify({"error": f"Ungültige Projekt-ID: {current_project}"}), 400
                except Exception as e:
                    print(f"⚠️ Fehler beim Update des Projekts: {e}")
                    import traceback
                    traceback.print_exc()
                    return jsonify({"error": f"Fehler beim Aktualisieren des Projekts: {e}"}), 500
            
            # Überprüfe das aktualisierte Profil
            updated_user = db.get_user_by_email(current_user_email)
            print(f"⭐️ Aktualisiertes Profil aus DB: {updated_user}")
            
            return jsonify({"message": "Profil erfolgreich aktualisiert"}), 200
            
    except Exception as e:
        import traceback
        print(f"⭐️ Fehler: {e}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
        
    finally:
        db.close()

@profile_bp.route("/api/change-password", methods=["POST"])
@jwt_required()
def change_password():
    """Endpunkt zum Ändern des Benutzerpassworts."""
    current_user_email = get_jwt_identity()
    data = request.get_json()
    
    # Überprüfe erforderliche Felder
    if not all(field in data for field in ['currentPassword', 'newPassword', 'confirmPassword']):
        return jsonify({
            'success': False,
            'message': 'Alle Passwortfelder sind erforderlich'
        }), 400
    
    # Überprüfe, ob das neue Passwort mit der Bestätigung übereinstimmt
    if data['newPassword'] != data['confirmPassword']:
        return jsonify({
            'success': False,
            'message': 'Das neue Passwort und die Bestätigung stimmen nicht überein'
        }), 400
    
    # Überprüfe Passwort-Komplexität
    if len(data['newPassword']) < 8:
        return jsonify({
            'success': False,
            'message': 'Das neue Passwort muss mindestens 8 Zeichen lang sein'
        }), 400
    
    try:
        db = Database()
        user = db.get_user_by_email(current_user_email)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'Benutzer nicht gefunden'
            }), 404
        
        # Überprüfe das aktuelle Passwort
        if not check_password_hash(user[7], data['currentPassword']):
            return jsonify({
                'success': False,
                'message': 'Das aktuelle Passwort ist falsch'
            }), 401
        
        # Generiere neuen Passwort-Hash und aktualisiere in der Datenbank
        new_password_hash = generate_password_hash(data['newPassword'])
        
        # Wir verwenden die update_password-Methode, die Data Vault-konform ist
        db.update_password(user[0], new_password_hash)
        
        return jsonify({
            'success': True,
            'message': 'Passwort erfolgreich geändert'
        }), 200
        
    except Exception as e:
        print(f"Fehler bei der Passwortänderung: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Ein interner Fehler ist aufgetreten'
        }), 500
    finally:
        db.close()