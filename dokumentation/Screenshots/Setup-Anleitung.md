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
