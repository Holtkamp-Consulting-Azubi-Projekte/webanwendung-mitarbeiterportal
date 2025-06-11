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

# 📁 Projektbaum

Führe im Terminal projektbaum.sh aus -> ./projektbaum.sh
Dadurch wird eine projektbaum.md erstellt

├── .gitignore
├── backend/
│   ├── app.py
│   ├── auth.py
│   ├── time_matrix.py
│   ├── requirements.txt
│   └── init_data_vault.sql # Nach backend/ verschoben
├── frontend/
│   ├── .dockerignore
│   ├── .env.development
│   ├── .gitignore
│   ├── Dockerfile
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
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
| GET     | `/api/logs`                  | Systemprotokolle abrufen (nur Admin)          |
| GET     | `/api/dashboard/summary`     | Dashboard-Kennzahlen und Visualisierungsdaten |
| GET     | `/api/admin/users`           | Alle Benutzer anzeigen (nur Admin)            |
| POST    | `/api/admin/users`           | Benutzer anlegen (nur Admin)                  |
| PUT     | `/api/admin/users/<user_id>` | Benutzer bearbeiten (nur Admin)               |
| DELETE  | `/api/admin/users/<user_id>` | Benutzer löschen (nur Admin)                  |

---

## 🧑‍💻 Setup & Initialisierung

### Voraussetzungen
- Docker und Docker Compose
- Git

### **Initialisierung und Start mit Docker Compose**

1. **Projekt klonen:**
    ```bash
    git clone <URL_ZU_IHREM_REPO>
    cd webanwendung-mitarbeiterportal
    ```

2.  **Datenbank initialisieren und Dienste starten:**
    Stellen Sie sicher, dass Sie sich im Hauptverzeichnis des geklonten Projekts befinden (dort, wo `docker-compose.yml` liegt).
    ```bash
    docker-compose up --build -d
    ```
    - Alle Images werden gebaut und die Container für Backend, Frontend, Datenbank, DB-Init und Nginx gestartet.
    - Die Datenbank wird automatisch initialisiert:  
      Der Service `db-init` führt das Skript `backend/init_update_data_vault.sql` gegen die Datenbank aus.  
      Das Skript legt alle Tabellen an, ergänzt neue Spalten und ist idempotent (keine Daten werden gelöscht).

3. **Anwendung aufrufen:**
    - Das Frontend ist nach wenigen Minuten unter  
      `http://localhost:3001`  
      (oder der IP deines Servers) erreichbar.

4. **Datenbankstruktur und Updates:**
    - Änderungen an der Datenbankstruktur werden durch das idempotente SQL-Skript automatisch ergänzt, sobald du erneut  
      ```bash
      docker-compose up -d
      ```
      ausführst.

---

### **Lokale Entwicklung (ohne Docker, optional)**

**Backend:**
1.  Navigiere in das `backend`-Verzeichnis.
2.  Python-Umgebung einrichten und Abhängigkeiten installieren:
    ```bash
    pip install -r requirements.txt
    ```
3.  Stelle sicher, dass eine PostgreSQL-Datenbank läuft und die Verbindungsparameter (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) als Umgebungsvariablen oder in einer `.env`-Datei gesetzt sind.
4.  Starte das Backend:
    ```bash
    python app.py
    ```

**Frontend:**
1.  Navigiere in das `frontend`-Verzeichnis.
2.  Node.js-Abhängigkeiten installieren:
    ```bash
    npm install
    ```
3.  Frontend starten:
    ```bash
    npm run dev
    ```

**Datenbank:**
- Richte eine lokale PostgreSQL-Instanz ein oder stelle sicher, dass das Backend auf die gewünschte Datenbank zugreifen kann.
- Führe das SQL-Initialisierungsskript (`init_update_data_vault.sql`) manuell aus, falls nötig.

---

## 👥 Mitwirkende
- Marco Grochowiak – Entwicklung & Projektleitung
- Tobias Holtkamp – Fachliche Beratung

## ⚖️ Lizenz
MIT-Lizenz