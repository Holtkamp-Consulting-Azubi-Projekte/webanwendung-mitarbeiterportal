"""
Datenbankverbindungsmodul für das Mitarbeiterportal.
Implementiert die direkte PostgreSQL-Verbindung mit psycopg2.
"""

import psycopg2
import os
from datetime import datetime
import hashlib

class Database:
    def __init__(self):
        self.conn = None
        self.cur = None
        self.connect()

    def connect(self):
        """Stellt die Verbindung zur Datenbank her."""
        try:
            self.conn = psycopg2.connect(
                dbname="mitarbeiterportal",
                user="admin",
                password="secret",
                host="db",
                port="5432"
            )
            self.cur = self.conn.cursor()
            print("Datenbankverbindung erfolgreich hergestellt")
        except Exception as e:
            print(f"Fehler beim Verbinden zur Datenbank: {e}")
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
        """Fügt einen neuen Benutzer hinzu."""
        try:
            # Hash-Key für den Benutzer generieren
            hk_user = hashlib.sha256(email.encode()).digest()
            now = datetime.utcnow()
            today = datetime.now().date()

            # Benutzer in H_USER einfügen
            self.execute(
                """
                INSERT INTO h_user (hk_user, user_id, t_from, rec_src)
                VALUES (%s, %s, %s, %s)
                """,
                (hk_user, email, now, 'API')
            )

            # Benutzerdetails in S_USER_DETAILS einfügen
            self.execute(
                """
                INSERT INTO s_user_details 
                (hk_user, t_from, b_from, rec_src, first_name, last_name)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (hk_user, now, today, 'API', first_name, last_name)
            )

            # Login-Daten in S_USER_LOGIN einfügen
            self.execute(
                """
                INSERT INTO s_user_login 
                (hk_user, t_from, b_from, rec_src, password_hash)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (hk_user, now, today, 'API', password_hash)
            )

            self.commit()
            return hk_user
        except Exception as e:
            self.rollback()
            print(f"Fehler in insert_user: {e}")
            raise

    def get_user_by_email(self, email):
        sql = """
            SELECT
                u.hk_user,
                u.user_id,
                d.first_name,
                d.last_name,
                d.position,
                d.core_hours,
                d.telefon,
                l.password_hash,     
                encode(cp.hk_project, 'hex') AS current_project
            FROM h_user u
            JOIN s_user_details d ON u.hk_user = d.hk_user AND d.t_to IS NULL
            JOIN s_user_login l ON u.hk_user = l.hk_user  -- NEU: join auf Login-Tabelle
            LEFT JOIN s_user_current_project cp ON cp.hk_user = u.hk_user AND cp.t_to IS NULL
            WHERE u.user_id = %s
        """
        with self.conn.cursor() as cur:
            cur.execute(sql, (email,))
            return cur.fetchone()


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
        """Aktualisiert das Benutzerpasswort."""
        try:
            now = datetime.utcnow()
            today = datetime.now().date()

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
        except Exception as e:
            self.rollback()
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