# 🧑‍💼 Webanwendung Mitarbeiterportal

## 🔥 Kurzbeschreibung

Diese Webanwendung dient als internes Mitarbeiterportal mit Funktionen wie Benutzerregistrierung & Login, Zeiterfassung, Projektverwaltung und einem wöchentlichen PDF-Export. Sie ist für den Einsatz in einem produktiven Teamumfeld konzipiert und läuft auf einem Raspberry Pi 5 mit PostgreSQL-Datenbank.

---

## 🚀 Technologiestack

### 🔧 Backend (Flask)
- Python 3.10+
- Flask + flask-cors
- Flask-JWT-Extended
- PostgreSQL (via psycopg2)
- JSON-Dateien für Benutzer (`users.json`) und Protokolle von Authentifizierungsereignissen (`logs.json`)
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
│   ├── user.py
│   ├── project.py
│   ├── time_tracking.py
│   ├── data/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   → Header, Footer, Buttons
│   │   ├── pages/        → Home, Login, Profil, Projekte, Zeiterfassung, Einstellungen
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
- [x] Registrierung mit Passwort-Hashing
- [x] Login mit JWT (JSON Web Token)
- [x] Profildaten anzeigen & bearbeiten (Name, E-Mail, Rolle etc.)
- [x] Protokollierung von Authentifizierungsereignissen (Login, Registrierung)
- [x] Geschützte Routen mit PrivateRoute-Komponente
- [x] AuthModal für Login/Registrierung auf der LandingPage

### 🕒 Zeiterfassung
- [x] Zeitstempeln (Start/Ende)
- [x] Tages- & Wochenansicht
- [x] PDF-Export der Wochenübersicht
- [x] Automatischer Versand (freitags 18 Uhr, geplant)
- [x] Verbesserte Datumsfilterung: Anzeige nur gefilterter Tage (ohne leere Tage bei Filter)
- [x] Spaltenreihenfolge angepasst (Datum vor Mitarbeiter)
- [x] Gesamtarbeitszeit über der Tabelle platziert
- [x] Filterzeile farblich hervorgehoben
- [x] Monats-/Jahresauswahl (Dropdown für 2025)
- [x] Neue Zeitmatrix-Komponente für verbesserte Zeiterfassung
- [x] Integration der Zeitmatrix in das Hauptlayout

### 📁 Projektverwaltung
- [x] Projekte anlegen, bearbeiten, löschen
- [ ] Projektbezogene Zeiterfassung (geplant)

### ⚙️ Einstellungen
- [x] Einstellungsseite mit Benutzeroptionen

---

## 🧪 API-Endpunkte (Auswahl)

| Methode | Endpoint               | Beschreibung                          |
|---------|------------------------|---------------------------------------|
| POST    | `/api/login`           | Login mit E-Mail/Passwort, gibt JWT zurück |
| POST    | `/api/register`        | Neue Registrierung                    |
| GET     | `/api/session`         | Aktuelle Session abfragen        |
| GET     | `/api/projects`        | Alle Projekte abrufen            |
| POST    | `/api/time/start`      | Startzeit erfassen               |
| POST    | `/api/time/end`        | Endzeit erfassen                 |

---

## 🧑‍💻 Setup Anleitung

### Voraussetzungen
- Node.js (v18+ empfohlen)
- Python 3.10+
- PostgreSQL-Server (läuft auf Raspberry Pi 5)
- Ports: `5173` (Frontend), `5050` (Backend)

### Backend starten

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### Frontend starten

```bash
cd frontend
npm install
npm run dev
```

### Test
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend-Test: [http://localhost:5050/api/ping](http://localhost:5050/api/ping)

---

## 👥 Mitwirkende
- Marco Grochowiak – Entwicklung & Projektleitung
- Tobias Holtkamp – Fachliche Beratung

## 📄 Lizenz
MIT-Lizenz
