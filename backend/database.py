"""
Datenbankverbindungsmodul für das Mitarbeiterportal.
Implementiert die direkte PostgreSQL-Verbindung mit psycopg2.
"""

import psycopg2
import os
import traceback
from datetime import datetime
import hashlib
import uuid

class Database:
    def __init__(self):
        self.conn = None
        self.cur = None
        self.connect()
        self._ensure_tables_exist()

    def connect(self):
        """Stellt die Verbindung zur Datenbank her."""
        try:
            self.conn = psycopg2.connect(
                host=os.getenv('DB_HOST', 'db'),
                port=os.getenv('DB_PORT', '5432'),
                dbname=os.getenv('DB_NAME', 'mitarbeiterportal'),
                user=os.getenv('DB_USER', 'admin'),
                password=os.getenv('DB_PASSWORD', 'secret')
            )
            self.cur = self.conn.cursor()
            print("Datenbankverbindung erfolgreich hergestellt")
        except Exception as e:
            print(f"Fehler beim Verbinden zur Datenbank: {e}")
            raise

    def _ensure_tables_exist(self):
        """Stellt sicher, dass alle benötigten Tabellen existieren."""
        try:
            # Prüfe, ob h_user existiert, wenn nicht, führe das init-Skript aus
            self.cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'h_user'
                );
            """)
            tables_exist = self.cur.fetchone()[0]
            
            if not tables_exist:
                print("Tabellen existieren nicht. Initialisiere Datenbankschema...")
                # Pfad zur SQL-Datei
                script_path = os.path.join(os.path.dirname(__file__), 'init_data_vault.sql')
                
                with open(script_path, 'r') as f:
                    sql_script = f.read()
                    self.cur.execute(sql_script)
                    self.conn.commit()
                    print("Datenbankschema erfolgreich initialisiert!")
            else:
                print("Datenbankschema bereits vorhanden.")
        
        except Exception as e:
            print(f"Fehler bei der Datenbankinitialisierung: {e}")
            self.conn.rollback()
            raise

    def close(self):
        """Schließt die Datenbankverbindung."""
        if self.cur:
            self.cur.close()
        if self.conn:
            self.conn.close()

    def commit(self):
        """Führt ein Commit der aktuellen Transaktion durch."""
        if self.conn:
            self.conn.commit()

    def rollback(self):
        """Führt ein Rollback der aktuellen Transaktion durch."""
        if self.conn:
            self.conn.rollback()

    def execute(self, query, params=None):
        """Führt eine SQL-Abfrage aus."""
        try:
            self.cur.execute(query, params or ())
            return self.cur
        except Exception as e:
            print(f"Fehler beim Ausführen der Abfrage: {e}")
            self.rollback()
            raise

    def fetch_one(self, query, params=None):
        """Führt eine SQL-Abfrage aus und gibt einen Datensatz zurück."""
        self.execute(query, params)
        return self.cur.fetchone()

    def fetch_all(self, query, params=None):
        """Führt eine SQL-Abfrage aus und gibt alle Datensätze zurück."""
        self.execute(query, params)
        return self.cur.fetchall()

    def insert_user(self, email, first_name, last_name, password_hash):
        """Fügt einen neuen Benutzer in die Datenbank ein."""
        try:
            # UUID als String verwenden
            hk_user = str(uuid.uuid4())
            
            # 1. Einfügen in h_user
            self.execute(
                """
                INSERT INTO h_user (hk_user, user_id, t_from, rec_src)
                VALUES (%s, %s, CURRENT_TIMESTAMP, %s)
                """, 
                (hk_user, email, 'WEB_APP')
            )
            
            # 2. Einfügen in s_user_details
            self.execute(
                """
                INSERT INTO s_user_details (hk_user, t_from, b_from, rec_src, first_name, last_name)
                VALUES (%s, CURRENT_TIMESTAMP, CURRENT_DATE, %s, %s, %s)
                """,
                (hk_user, 'WEB_APP', first_name, last_name)
            )
            
            # 3. Einfügen in s_user_login
            self.execute(
                """
                INSERT INTO s_user_login (hk_user, t_from, b_from, rec_src, password_hash)
                VALUES (%s, CURRENT_TIMESTAMP, CURRENT_DATE, %s, %s)
                """,
                (hk_user, 'WEB_APP', password_hash)
            )
            
            self.conn.commit()
            return hk_user
        except Exception as e:
            self.conn.rollback()
            print(f"Fehler beim Einfügen des Benutzers: {e}")
            traceback.print_exc()
            raise

    def get_user_by_email(self, email):
        return self.fetch_one("""
            SELECT h.hk_user, h.user_id, d.first_name, d.last_name, d.position, d.core_hours, d.telefon, l.password_hash, d.is_admin
            FROM h_user h
            LEFT JOIN s_user_details d ON h.hk_user = d.hk_user AND d.t_to IS NULL
            LEFT JOIN s_user_login l ON h.hk_user = l.hk_user AND l.t_to IS NULL
            WHERE h.user_id = %s AND h.t_to IS NULL
        """, (email,))

    def update_user_details(self, hk_user, update_data):
        """Aktualisiert die Benutzerdetails."""
        try:
            now = datetime.utcnow()
            today = datetime.now().date()

            # Aktuelle Details als historisch markieren
            self.execute(
                """
                UPDATE s_user_details
                SET t_to = %s, b_to = %s
                WHERE hk_user = %s AND t_to IS NULL
                """,
                (now, today, hk_user)
            )

            # Neue Details einfügen
            self.execute(
                """
                INSERT INTO s_user_details 
                (hk_user, t_from, b_from, rec_src, first_name, last_name, position, core_hours, telefon)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (hk_user, now, today, 'API',
                 update_data.get('firstName'),
                 update_data.get('lastName'),
                 update_data.get('position'),
                 update_data.get('coreHours'),
                 update_data.get('telefon'))
            )

            self.commit()
        except Exception as e:
            self.rollback()
            raise

    def update_password(self, hk_user, new_password_hash):
        """
        Aktualisiert das Passwort eines Benutzers.
        
        Args:
            hk_user (bytes/str): Die HK_USER ID des Benutzers
            new_password_hash (str): Der Hash des neuen Passworts
        """
        try:
            now = datetime.utcnow()
            today = datetime.now().date()

            # Debug-Ausgabe
            print(f"Aktualisiere Passwort für hk_user {hk_user}")

            # Aktuelle Login-Daten als historisch markieren
            self.execute(
                """
                UPDATE s_user_login
                SET t_to = %s, b_to = %s
                WHERE hk_user = %s AND t_to IS NULL
                """,
                (now, today, hk_user)
            )

            # Neue Login-Daten einfügen
            self.execute(
                """
                INSERT INTO s_user_login 
                (hk_user, t_from, b_from, rec_src, password_hash)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (hk_user, now, today, 'API', new_password_hash)
            )

            self.commit()
            print(f"Passwort erfolgreich aktualisiert für hk_user {hk_user}")
        except Exception as e:
            self.rollback()
            print(f"Fehler bei Passwortaktualisierung: {str(e)}")
            raise

    def get_projects(self):
        """Holt alle verfügbaren Projekte."""
        return self.fetch_all(
            """
            SELECT DISTINCT p.project_name
            FROM h_project p
            LEFT JOIN s_project_details d ON d.hk_project = p.hk_project AND d.t_to IS NULL
            ORDER BY p.project_name
            """
        )

    def get_all_projects(self):
        """
        Holt alle Projekte aus der Datenbank.
        
        Returns:
            list: Eine Liste von Projekt-Dictionaries mit hk_project und project_name
        """
        result = self.fetch_all("""
            SELECT h.hk_project::text as hk_project_hex, s.project_name 
            FROM h_project h
            JOIN s_project_details s ON h.hk_project = s.hk_project
            WHERE s.t_to IS NULL
            ORDER BY s.project_name
        """)
        
        # Konvertiere das Ergebnis in eine Liste von Dictionaries
        projects = []
        for row in result:
            projects.append({
                "hk_project": row[0],
                "project_name": row[1]
            })
        return projects

    def update_user_project(self, hk_user, hk_project):
        """
        Aktualisiert das aktuelle Projekt eines Benutzers.
        
        Args:
            hk_user (bytes): Die ID des Benutzers
            hk_project (bytes oder None): Die ID des Projekts oder None, wenn kein Projekt ausgewählt ist
        """
        try:
            now = datetime.utcnow()
            today = datetime.now().date()
            
            # Debug-Ausgabe
            print(f"UPDATE_USER_PROJECT:")
            print(f"- hk_user: {hk_user.hex() if isinstance(hk_user, bytes) else hk_user}")
            if hk_project:
                print(f"- hk_project: {hk_project.hex() if isinstance(hk_project, bytes) else hk_project}")
            else:
                print("- hk_project: None (kein Projekt)")
            
            # Aktuelle Projektverknüpfungen als historisch markieren
            rows_updated = self.execute(
                """
                UPDATE s_user_current_project
                SET t_to = %s, b_to = %s
                WHERE hk_user = %s AND t_to IS NULL
                """,
                (now, today, hk_user)
            ).rowcount
            print(f"- Historisierte Einträge: {rows_updated}")
            
            # Wenn ein Projekt gesetzt wird, fügen wir es ein
            if hk_project:
                # Prüfen, ob das Projekt existiert
                project_exists = self.fetch_one("""
                    SELECT COUNT(*) FROM h_project 
                    WHERE hk_project = %s
                """, (hk_project,))
                
                if not project_exists or project_exists[0] == 0:
                    print(f"- Projekt existiert nicht in h_project. Erstelle es zuerst")
                    # Projekt erstellen
                    self.execute("""
                        INSERT INTO h_project (hk_project, t_from, rec_src)
                        VALUES (%s, %s, %s)
                    """, (hk_project, now, 'API'))
                    
                    # Projektdetails erstellen
                    self.execute("""
                        INSERT INTO s_project_details 
                        (hk_project, t_from, b_from, rec_src, project_name, project_description)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (hk_project, now, today, 'API', f'Projekt {hk_project.hex()[:8]}', 'Automatisch erstellt'))
                    
                    print(f"- Projekt wurde erstellt: {hk_project.hex()}")
                
                # Projekt-Benutzer-Verknüpfung erstellen
                self.execute(
                    """
                    INSERT INTO s_user_current_project 
                    (hk_user, hk_project, t_from, b_from, rec_src)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (hk_user, hk_project, now, today, 'API')
                )
                print(f"- Neue Projekt-Benutzer-Verknüpfung erstellt")
                
                # Nach dem Einfügen überprüfen, ob die Verknüpfung erstellt wurde
                check = self.fetch_one("""
                    SELECT hk_project::text
                    FROM s_user_current_project
                    WHERE hk_user = %s AND hk_project = %s AND t_to IS NULL
                """, (hk_user, hk_project))
                
                if check:
                    print(f"- ERFOLG: Verknüpfung wurde erstellt und ist aktiv: {check[0]}")
                else:
                    print("- FEHLER: Verknüpfung konnte nicht erstellt werden!")
            
            # WICHTIG: Commit der Transaktion!
            self.commit()
            print("- Transaktion erfolgreich abgeschlossen")
            
        except Exception as e:
            # Bei einem Fehler Rollback durchführen
            self.rollback()
            print(f"- FEHLER: {str(e)}")
            import traceback
            traceback.print_exc()
            raise
