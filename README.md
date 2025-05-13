# Backend

# 🔧 Backend – Flask API

## Technologiestack

- Python 3
- Flask
- flask-cors
- JSON-Dateien zur Datenspeicherung (kein DB-Anschluss bisher)

## API-Endpunkte (bisher)

| Methode | Endpoint             | Beschreibung              |
|---------|----------------------|---------------------------|
| GET     | `/api/ping`         | Test-Endpunkt             |

## Struktur

- `app.py` – Flask-App mit CORS & Routing
- `data/users.json` – Benutzer
- `data/session.json` – Sessions
- `data/logs.json` – Logdaten

## ToDo

- Login/Registrierung
- User-Verwaltung
- Zeiterfassung
- Projekt-CRUD


---

# Frontend

# 🎨 Frontend – React + Tailwind

## Technologiestack

- React (mit Vite)
- Tailwind CSS
- JSX-Komponentenstruktur

## Seitenstruktur

- `Home.jsx` – Startseite mit Backend-Check
- `Login.jsx` – Login-Formular (noch leer)
- `Projekte.jsx` – Projektübersicht (geplant)
- `Profil.jsx` – Benutzerprofil (geplant)
- `Zeiterfassung.jsx` – Zeiterfassung (geplant)

## Komponenten

- `Header.jsx`, `Footer.jsx`
- Eigene Styles z. B. in `header.css`

## ToDo

- Routing mit `react-router-dom`
- Layout (Navigation, Struktur)
- Daten aus Backend anzeigen


---

# Projektstruktur

# 📁 Projektstruktur – Mitarbeiterportal

## Hauptverzeichnis

```
webanwendung-mitarbeiterportal/
├── backend/           → Flask-Backend mit API-Endpunkten
├── frontend/          → React-Frontend mit Tailwind CSS
├── dokumentation/     → Alle technischen Doku-Dateien
├── .gitignore         → Git-Ausnahmen
├── README.md          → Projektbeschreibung
```

## Backend-Verzeichnis

- `app.py` – Einstiegspunkt, Start der Flask-App
- `auth.py`, `user.py`, `project.py`, `time_tracking.py` – Moduldateien
- `data/` – JSON-Dateien zur Benutzerspeicherung
- `venv/` – Python-virtuelle Umgebung (nicht versioniert)

## Frontend-Verzeichnis

- `src/pages/` – Seiten wie Home, Login, Projekte
- `src/components/` – Header, Footer, etc.
- `src/styles/` – Eigene CSS-Dateien (z. B. `header.css`)
- `index.html`, `vite.config.js`, `tailwind.config.js`

## Dokumentation

- Diese Datei: Strukturübersicht
- Weitere Dateien: Setup-Anleitung, Backend, Frontend


---

# Setup Anleitung

# ⚙️ Setup-Anleitung – Mitarbeiterportal

## Voraussetzungen

- Node.js (empfohlen: v18+)
- npm
- Python 3.10+
- PostgreSQL (optional, aktuell nicht eingebunden)
- Ports: 5173 (Frontend), 5050 (Backend)

---

## Backend starten

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

---

## Frontend starten

```bash
cd frontend
npm install
npm run dev
```

---

## Test

- Öffne `http://localhost:5173` → Startseite erscheint
- Backend erreichbar über `http://localhost:5050/api/ping`


---

