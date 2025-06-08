# 🧑‍💼 Webanwendung Mitarbeiterportal

## 🔥 Kurzbeschreibung

Diese Webanwendung dient als internes Mitarbeiterportal mit Funktionen wie Benutzerregistrierung & Login, Zeiterfassung, Projekt- und Kundenverwaltung sowie einem Dashboard mit Visualisierungen. Sie ist für den Einsatz in einem produktiven Teamumfeld konzipiert und nutzt eine **PostgreSQL-Datenbank**.

---

## 🚀 Technologiestack

### 🔧 Backend (Flask)
- Python 3.10+
- Flask + flask-cors
- Flask-JWT-Extended
- PostgreSQL (via psycopg2)
- PDF-Erstellung über ReportLab (für Wochenberichte)

### 🎨 Frontend (React)
- React mit Vite
- Tailwind CSS
- JSX-Komponentenstruktur
- Routing via `react-router-dom`
- Chart.js & react-chartjs-2 für Visualisierungen

---

## 📁 Projektstruktur

```
webanwendung-mitarbeiterportal/
├── backend/
│   ├── app.py
│   ├── auth.py
│   ├── time_matrix.py
│   ├── dashboard.py
│   ├── requirements.txt
│   └── init_data_vault.sql
├── frontend/
│   ├── src/
│   │   ├── components/   → Header, Footer, Buttons, TimeEntryModal, TimeMatrixTable, auth/
│   │   ├── pages/        → LandingPage, Dashboard, Profil, Projekte, Zeitmatrix, Einstellungen
│   │   └── styles/       → header.css, footer.css
│   ├── public/
│   └── package.json
├── dokumentation/
├── .gitignore
├── README.md
├── docker-compose.yml
```

---

## 🗄️ Datenbankstruktur

Das Mitarbeiterportal verwendet eine PostgreSQL-Datenbank nach dem Data Vault 2.0 Modellierungsansatz mit folgender Struktur:

### Haupttabellen
- **h_user** - Hub für Benutzerreferenzen (UUID als Primary Key)
- **h_project** - Hub für Projektreferenzen (UUID)
- **h_customer** - Hub für Kundenreferenzen (UUID)
- **s_user_details** - Benutzerdaten (Name, Position, Kontaktinformationen, Kernarbeitszeiten)
- **s_user_login** - Login-Informationen (Hashes für Passwortsicherheit)
- **s_project_details** - Projektinformationen (Name, Beschreibung, Start/End-Daten, Budget)
- **s_customer_details** - Kundeninformationen (Kontaktperson, Adresse)
- **s_timeentry_details** - Zeiterfassungsdaten (Datum, Start/End-Zeiten, Beschreibung)
- **s_user_current_project** - Verknüpfung zwischen Nutzern und ihren aktuell zugewiesenen Projekten
- **l_user_project_timeentry** - Verknüpfungstabelle zwischen Benutzer, Projekt und Zeiteinträgen
- **app_logs** - Systemprotokolle für Sicherheit und Nachverfolgung

Die Datenbank nutzt UUIDs für alle Primär- und Fremdschlüssel zur besseren Skalierbarkeit und Flexibilität.

---

## ✅ Bisher implementierte Features

### 🔐 Benutzerverwaltung
- [✅] Registrierung mit Passwort-Hashing
- [✅] Login mit JWT (JSON Web Token)
- [✅] Profildaten anzeigen & bearbeiten (Name, E-Mail, Position, Telefon, Kernarbeitszeit, Aktuelles Projekt)
- [x] Protokollierung von Authentifizierungsereignissen (Login, Registrierung)
- [✅] Geschützte Routen mit PrivateRoute-Komponente
- [✅] AuthModal für Login/Registrierung auf der LandingPage
- [✅] Verbesserte Fehlerbehandlung bei Login/Registrierung
- [✅] Validierung grundlegender Benutzerdaten (Passwortlänge)

### 🕒 Zeiterfassung
- [✅] Anzeige der Zeitmatrix-Tabelle
- [x] Tages- & Wochenansicht
- [x] PDF-Export der Wochenübersicht
- [✅] Verbesserte Datumsfilterung: Anzeige nur gefilterter Tage
- [✅] Gesamtarbeitszeit über der Tabelle platziert
- [x] Filterzeile farblich hervorgehoben
- [x] Monats-/Jahresauswahl (Dropdown für 2025)
- [✅] Neue Zeitmatrix-Komponente für verbesserte Zeiterfassung
- [✅] Integration der Zeitmatrix in das Hauptlayout
- [✅] Kernarbeitszeit-Integration in Zeiteinträge
- [x] Visuelle Hervorhebung von Einträgen außerhalb der Kernarbeitszeit
- [✅] Arbeitsorte für Zeiteinträge (Home-Office, Büro, etc.)

### 👤 Profil
- [✅] Anzeige und Bearbeitung von Profildaten
- [✅] Kernarbeitszeit-Einstellung mit grundlegender Validierung
- [✅] Standardprojekt-Auswahl
- [✅] Passwortänderung
- [✅] Telefonnummer und Position

### 📁 Projektverwaltung
- [✅] Projekte abrufen und anzeigen
- [✅] Projekte anlegen, bearbeiten, löschen
- [✅] Projektbezogene Zeiterfassung
- [✅] Standardprojekt im Profil
- [✅] Kundenzuordnung zu Projekten

### 👥 Kundenverwaltung
- [✅] Kunden anlegen, bearbeiten und löschen
- [✅] Zuordnung von Projekten zu Kunden
- [✅] Kundendetails (Adresse, Kontaktperson)
- [✅] Historisierung statt physisches Löschen (Data Vault-Prinzip)

### 📊 Dashboard
- [✅] Übersicht der wichtigsten Kennzahlen (Arbeitstage, Gesamtstunden, Top-Projekt)
- [✅] Balkendiagramm: Stunden pro Tag (Woche)
- [✅] Kreisdiagramm: Projektverteilung
- [✅] Kreisdiagramm: Arbeitsorte (letzte 30 Tage)
- [x] Filter nach Zeitraum, Mitarbeiter, Projekt (geplant)
- [x] Vergleich Soll-/Ist-Stunden, Über-/Unterstunden pro Mitarbeiter (geplant)
- [x] Erweiterte Tabellen und Visualisierungen (geplant)

### ⚙️ Einstellungen
- [✅] Einstellungsseite
- [x] Benutzerspezifische Anzeigeoptionen
- [x] Benachrichtigungseinstellungen
- [x] Sprache und Region
- [x] Export-Einstellungen für PDF-Berichte

### 💾 Technische Verbesserungen
- [✅] Migration von BYTEA zu UUID für alle Primär- und Fremdschlüssel
- [✅] Optimierte Datenbankabfragen mit TEXT-Typkonvertierungen
- [✅] Data Vault 2.0 Konformität mit korrekter Historisierung
- [✅] Fehlerbehandlung für leere Strings bei numerischen Feldern
- [✅] Entfernung von Debug-Ausgaben in der Entwicklungsumgebung

---

## 🧪 API-Endpunkte (Auswahl)

| Methode | Endpoint                     | Beschreibung                                  |
|---------|------------------------------|-----------------------------------------------|
| POST    | `/api/login`                 | Login mit E-Mail/Passwort, gibt JWT zurück    |
| POST    | `/api/register`              | Neue Registrierung                            |
| GET     | `/api/ping`                  | Einfacher Health-Check                        |
| GET     | `/api/status`                | Systemstatus für Healthcheck                  |
| GET     | `/api/projects`              | Alle Projekte abrufen                         |
| POST    | `/api/projects`              | Neues Projekt erstellen                       |
| PUT     | `/api/projects/<hk_project>` | Projektdaten aktualisieren                    |
| DELETE  | `/api/projects/<hk_project>` | Projekt löschen                               |
| GET     | `/api/customers`             | Alle Kunden abrufen                           |
| POST    | `/api/customers`             | Neuen Kunden erstellen                        |
| PUT     | `/api/customers/<hk_customer>` | Kundendaten aktualisieren                   |
| DELETE  | `/api/customers/<hk_customer>` | Kunde löschen                               |
| GET     | `/api/profile`               | Profildaten abrufen                           |
| PUT     | `/api/profile`               | Profildaten aktualisieren                     |
| PUT     | `/api/change-password`       | Passwort ändern                               |
| GET     | `/api/time-entries`          | Zeiteinträge abrufen                          |
| POST    | `/api/time-entries`          | Neuen Zeiteintrag erstellen                   |
| PUT     | `/api/time-entries/<id>`     | Zeiteintrag aktualisieren                     |
| DELETE  | `/api/time-entries/<id>`     | Zeiteintrag löschen                           |
| GET     | `/api/reports/weekly/<week>` | Wochenbericht als PDF generieren              |
| GET     | `/api/logs`                  | Systemprotokolle abrufen (nur Admin)          |
| GET     | `/api/dashboard/summary`     | Dashboard-Kennzahlen und Visualisierungsdaten |

---

## 🧑‍💻 Setup Anleitung

### Voraussetzungen
- Docker und Docker Compose
- Git

### Einrichtung mit Docker Compose (Empfohlen)

1.  **Projekt klonen:**
    ```bash
    git clone <URL_ZU_IHREM_REPO>
    cd webanwendung-mitarbeiterportal
    ```

2.  **Datenbank initialisieren und Dienste starten:**
    ```bash
    docker-compose up --build -d
    ```
    Dieser Befehl baut die Docker-Images (falls nötig), erstellt und startet die Container für Backend, Frontend und Datenbank. `-d` startet die Container im Hintergrund.

3.  **Datenbank-Tabellen erstellen:**
    Die Datenbankinitialisierung wird beim ersten Start des Backend-Containers automatisch ausgeführt, da der `psql`-Client im Dockerfile installiert ist und das `init_data_vault.sql` Skript beim Start von `app.py` ausgeführt wird.
    Überprüfen Sie die Logs des Backend-Containers, um sicherzustellen, dass die Tabellen erfolgreich erstellt wurden:
    ```bash
    docker logs mitarbeiterportal-backend
    ```
    Suchen Sie nach der Meldung "Datenbank-Tabellen wurden erfolgreich erstellt." oder "Datenbank-Tabellen existieren bereits.".

4.  **Anwendung aufrufen:**
    Nachdem die Container gestartet sind, ist das Frontend unter `http://localhost:3000` erreichbar.

### Lokale Entwicklung (Alternative)

Für die lokale Entwicklung ohne Docker müssen Python und Node.js sowie eine PostgreSQL-Instanz separat eingerichtet werden. Beachten Sie, dass Unterschiede zur Docker-Umgebung auftreten können.

**Backend:**

1.  Navigieren Sie in das `backend`-Verzeichnis.
2.  Richten Sie eine Python-Umgebung ein und installieren Sie die Abhängigkeiten (`pip install -r requirements.txt`).
3.  Stellen Sie sicher, dass eine PostgreSQL-Datenbank läuft und die Verbindungsparameter (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD) als Umgebungsvariablen oder in einer `.env`-Datei gesetzt sind.
4.  Führen Sie `python app.py` aus.

**Frontend:**

1.  Navigieren Sie in das `frontend`-Verzeichnis.
2.  Installieren Sie die Node.js-Abhängigkeiten (`npm install`).
3.  Führen Sie `npm run dev` aus.

**Datenbank:**

Richten Sie eine lokale PostgreSQL-Instanz ein oder stellen Sie sicher, dass das lokal laufende Backend auf Ihre Datenbank auf dem Raspberry Pi zugreifen kann.

---

## 👥 Mitwirkende
- Marco Grochowiak – Entwicklung & Projektleitung
- Tobias Holtkamp – Fachliche Beratung

## ⚖️ Lizenz
MIT-Lizenz