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
