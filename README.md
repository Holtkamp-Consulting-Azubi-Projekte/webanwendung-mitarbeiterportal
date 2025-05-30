# 🧑‍💼 Webanwendung Mitarbeiterportal

## 🔥 Kurzbeschreibung

Diese Webanwendung dient als internes Mitarbeiterportal mit Funktionen wie Benutzerregistrierung & Login, Zeiterfassung, Projektverwaltung und einem wöchentlichen PDF-Export. Sie ist für den Einsatz in einem produktiven Teamumfeld konzipiert und nutzt eine **PostgreSQL-Datenbank**.

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

---

## 📁 Projektstruktur

```
webanwendung-mitarbeiterportal/
├── backend/
│   ├── app.py
│   ├── auth.py
│   ├── time_matrix.py
│   ├── requirements.txt
│   └── init_data_vault.sql # Nach backend/ verschoben
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
```

---

## ✅ Bisher implementierte Features

### 🔐 Benutzerverwaltung
- [x] Registrierung mit Passwort-Hashing (Datenbank)
- [x] Login mit JWT (JSON Web Token) (Datenbank)
- [x] Profildaten anzeigen & bearbeiten (Name, E-Mail, Position, Telefon, Kernarbeitszeit, Aktuelles Projekt) (Datenbank)
- [x] Protokollierung von Authentifizierungsereignissen (Login, Registrierung)
- [x] Geschützte Routen mit PrivateRoute-Komponente
- [x] AuthModal für Login/Registrierung auf der LandingPage
- [x] Verbesserte Fehlerbehandlung bei Login/Registrierung
- [x] Validierung grundlegender Benutzerdaten (Passwortlänge)

### 🕒 Zeiterfassung
- [x] Anzeige der Zeitmatrix-Tabelle
- [ ] Zeitstempeln (Start/Ende) (Datenbank)
- [ ] Tages- & Wochenansicht (Datenbank) - **Implementierung in Zeitmatrix-Tabelle**
- [ ] PDF-Export der Wochenübersicht
- [ ] Automatischer Versand (geplant)
- [ ] Verbesserte Datumsfilterung: Anzeige nur gefilterter Tage (ohne leere Tage bei Filter) - **Implementierung in Zeitmatrix-Tabelle**
- [x] Spaltenreihenfolge angepasst
- [ ] Gesamtarbeitszeit über der Tabelle platziert - **Implementierung in Zeitmatrix-Tabelle**
- [ ] Filterzeile farblich hervorgehoben - **Implementierung in Zeitmatrix-Tabelle**
- [x] Monats-/Jahresauswahl (Dropdown für 2025) - **Implementierung in Zeitmatrix-Tabelle**
- [x] Neue Zeitmatrix-Komponente für verbesserte Zeiterfassung
- [x] Integration der Zeitmatrix in das Hauptlayout
- [ ] Kernarbeitszeit-Integration in Zeiteinträge - **Anzeige im Profil**
- [ ] Visuelle Hervorhebung von Einträgen außerhalb der Kernarbeitszeit - **Hinweis im TimeEntryModal**

### 👤 Profil
- [x] Anzeige und Bearbeitung von Profildaten (Datenbank)
- [x] Kernarbeitszeit-Einstellung mit grundlegender Validierung
- [x] Standardprojekt-Auswahl (Datenbank)
- [x] Passwortänderung (Datenbank)
- [x] Telefonnummer und Position (Datenbank)

### 📁 Projektverwaltung
- [x] Projekte abrufen und anzeigen (Datenbank) - **Verwendet im Profil und Zeitmatrix**
- [ ] Projekte anlegen, bearbeiten, löschen
- [x] Projektbezogene Zeiterfassung (Datenbank) - **Erfassung von Projekten in Zeiteinträgen**
- [x] Standardprojekt im Profil (Datenbank)

### ⚙️ Einstellungen
- [x] Einstellungsseite (Platzhalter)

---

## 🧪 API-Endpunkte (Auswahl)

| Methode | Endpoint               | Beschreibung                                  |
|---------|------------------------|-----------------------------------------------|
| POST    | `/api/login`           | Login mit E-Mail/Passwort, gibt JWT zurück (DB) |
| POST    | `/api/register`        | Neue Registrierung (DB)                       |
| GET     | `/api/ping`            | Einfacher Health-Check                        |
| GET     | `/api/status`          | Systemstatus für Healthcheck                  |
| GET     | `/api/projects`        | Alle Projekte abrufen (DB)                   |
| GET     | `/api/profile`         | Profildaten abrufen (DB)                     |
| PUT     | `/api/profile`         | Profildaten aktualisieren (DB)                |
| PUT     | `/api/change-password` | Passwort ändern (DB)                         |
| GET     | `/api/time-entries`     | Zeiteinträge abrufen (DB)                     |
| POST    | `/api/time-entries`     | Neuen Zeiteintrag erstellen (DB)              |
| PUT     | `/api/time-entries/<id>`     | Zeiteintrag aktualisieren (DB)                |
| DELETE  | `/api/time-entries/<id>`   | Zeiteintrag löschen (DB)                     |

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
    Stellen Sie sicher, dass Sie sich im Hauptverzeichnis des geklonten Projekts befinden (dort, wo `docker-compose.yml` liegt).
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

dummy