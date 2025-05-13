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
