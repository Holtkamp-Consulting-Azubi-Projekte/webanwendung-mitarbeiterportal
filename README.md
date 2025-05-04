# 🧑‍💼 Webanwendung Mitarbeiterportal

Dies ist eine moderne Webanwendung zur Verwaltung von Mitarbeitenden, Arbeitszeiten und Projekten. Die App wurde im Rahmen eines Abschlussprojekts entwickelt und basiert auf einem Fullstack-Stack mit React, Flask und PostgreSQL.

---

## 🚀 Funktionen

- ✅ Benutzer-Registrierung und Login
- ✅ Passwort-Hashing und sichere Session-Verwaltung (JSON-basiert)
- ✅ Navigation mit geschütztem Dashboard
- ✅ Logout-Funktion mit Session-Handling
- ✅ Login- und Registerseiten mit integriertem Firmenlogo
- ✅ Responsives Frontend mit Tailwind CSS
- ✅ Backend-API in Flask (Python)
- ✅ JSON-Dateien für einfache Datenhaltung (users, session, logs)

---

## 🛠 Tech Stack

| Bereich         | Technologie         |
|----------------|---------------------|
| **Frontend**   | React + Vite        |
| **Styling**    | Tailwind CSS        |
| **Backend**    | Python + Flask      |
| **API-Sicherheit** | flask-cors      |
| **Datenhaltung** | JSON-Dateien (z. B. `users.json`) |
| **Hosting lokal** | Vite + Flask Dev Server |
| **Deployment-ready** | Docker (geplant), systemd, Git |
| **Datenbank (optional)** | PostgreSQL (für später)

---

## 📁 Projektstruktur (Auszug)

```plaintext
webanwendung-mitarbeiterportal/
├── backend/
│   ├── app.py
│   ├── data/
│   │   ├── users.json
│   │   ├── session.json
│   │   └── logs.json
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Header.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── Logout.jsx
│   │   ├── App.jsx
│   │   └── assets/
│   │       └── logo.png
└── README.md

▶️ Lokale Entwicklung

🖥️ Frontend starten

cd frontend
npm install
npm run dev

🐍 Backend starten (in virtualenv)

cd backend
source venv/bin/activate
python app.py

🔒 Hinweise zur Sicherheit
Passwörter werden gehasht gespeichert (SHA256)

Sessions werden in session.json gespeichert

CORS ist für http://localhost:5173 freigeschaltet

Für Produktion wird später PostgreSQL verwendet

🧪 Nächste Schritte
 Rollen- und Rechteverwaltung

 Datenbankanbindung an PostgreSQL

 Benutzerverwaltung im Dashboard

 Adminfunktionen

 👨‍💻 Entwickler
Marco Grochowiak
Projekt im Rahmen der Umschulung zum Fachinformatiker (Daten- & Prozessanalyse)

📄 Lizenz
Privates Ausbildungsprojekt. Keine kommerzielle Nutzung.