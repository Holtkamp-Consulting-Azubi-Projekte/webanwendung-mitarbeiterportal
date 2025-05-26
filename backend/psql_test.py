import psycopg2
import os

# Umgebungsvariablen holen
user = os.getenv("DB_USER")
password = os.getenv("DB_PASSWORD")
host = os.getenv("DB_HOST")
port = os.getenv("DB_PORT")
dbname = os.getenv("DB_NAME")

try:
    # Verbindung zur DB aufbauen
    conn = psycopg2.connect(
        dbname=dbname,
        user=user,
        password=password,
        host=host,
        port=port
    )
    print("Verbindung erfolgreich!")

    # Cursor holen – darüber führen wir SQL-Befehle aus
    cur = conn.cursor()

    # Testabfrage
    cur.execute("SELECT version();")
    version = cur.fetchone()
    print("PostgreSQL-Version:", version)

    # Aufräumen
    cur.close()
    conn.close()

except Exception as e:
    print("Fehler beim Verbinden oder Abfragen:", e)
